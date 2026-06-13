<template>
    <div class="max-w-2xl space-y-4">
        <div>
            <h1 class="text-lg font-bold text-slate-800">Enviar notificación</h1>
            <p class="text-xs text-slate-500">Selecciona plantilla y canal, captura destinatario y vars, y envía. Útil para pruebas y avisos puntuales.</p>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div class="grid sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Plantilla</label>
                    <select v-model="selectedKey" class="w-full border rounded-md px-2 py-1.5 text-sm" @change="onTemplateChange">
                        <option value="">— Selecciona —</option>
                        <option v-for="(_opts, key) in groupedTemplates" :key="key" :value="key">{{ key }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Canal</label>
                    <select v-model="selectedChannel" class="w-full border rounded-md px-2 py-1.5 text-sm" :disabled="!selectedKey">
                        <option value="">— Selecciona —</option>
                        <option
                            v-for="ch in availableChannelsForKey"
                            :key="ch.channel"
                            :value="ch.channel"
                            :disabled="!ch.channelConfigured"
                        >
                            {{ channelLabel(ch.channel) }}<template v-if="ch.isOverride"> (override)</template><template v-if="!ch.channelConfigured"> · falta configurar</template>
                        </option>
                    </select>
                </div>
            </div>

            <div>
                <label for="notif-recipient-search" class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Destinatario</label>
                <div class="relative" ref="searchRootRef">
                    <input
                        id="notif-recipient-search"
                        v-model="recipientQuery"
                        type="text"
                        class="w-full border rounded-md px-2 py-1.5 text-sm"
                        placeholder="Busca por nombre o email..."
                        :disabled="!selectedChannel"
                        @focus="onSearchFocus"
                    />
                    <ul
                        v-if="searchOpen && (recipients.length > 0 || searchLoading)"
                        class="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow max-h-64 overflow-y-auto"
                    >
                        <li v-if="searchLoading" class="px-3 py-2 text-xs text-slate-400 italic">Buscando...</li>
                        <li
                            v-for="r in recipients"
                            :key="r.userId"
                            class="px-3 py-2 text-xs hover:bg-indigo-50 cursor-pointer"
                            @mousedown.prevent="pickRecipient(r)"
                        >
                            <div class="font-semibold text-slate-800">{{ r.name }}</div>
                            <div class="text-[11px] text-slate-500">
                                <span v-if="selectedChannel === 'email'">{{ r.email ?? '— sin correo —' }}</span>
                                <span v-else-if="selectedChannel === 'sms' || selectedChannel === 'whatsapp'">{{ r.phone ?? '— sin teléfono —' }}</span>
                                <span v-else>ID: {{ r.userId }} · {{ r.email }}</span>
                            </div>
                        </li>
                    </ul>
                </div>
                <p v-if="!selectedChannel" class="text-[10px] text-slate-400 mt-1">
                    Selecciona un canal primero.
                </p>
                <div v-if="selectedRecipient" class="mt-2 flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-md px-2 py-1.5">
                    <div class="text-xs">
                        <div class="font-semibold text-indigo-900">{{ selectedRecipient.name }}</div>
                        <div class="text-[11px] text-indigo-700 font-mono">{{ resolvedAddress || '— sin dirección para este canal —' }}</div>
                    </div>
                    <button class="text-[10px] text-slate-500 hover:text-red-600" @click="clearRecipient">Quitar</button>
                </div>
                <p v-if="selectedRecipient && !resolvedAddress" class="text-[11px] text-amber-700 mt-1">
                    Este usuario no tiene {{ selectedChannel === 'email' ? 'email' : 'teléfono' }} registrado. Elige otro canal o destinatario.
                </p>
            </div>

            <div v-if="currentTemplate">
                <p class="text-[11px] font-bold uppercase text-slate-600 mb-1">Variables disponibles</p>
                <div v-if="!hasVariables" class="text-xs text-slate-400 italic">Esta plantilla no declara variables.</div>
                <div v-else class="space-y-2">
                    <div v-for="(desc, key) in currentTemplate.availableVariables" :key="key" class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                        <code class="text-[11px] text-slate-600 font-mono">{{ key }}</code>
                        <input
                            :value="getVar(key)"
                            @input="setVar(key, ($event.target as HTMLInputElement).value)"
                            type="text"
                            class="col-span-2 border rounded-md px-2 py-1 text-xs"
                            :placeholder="desc"
                        />
                    </div>
                </div>
            </div>

            <div v-if="currentTemplate" class="border border-slate-200 rounded-md p-3 bg-slate-50">
                <p class="text-[10px] font-bold uppercase text-slate-500 mb-1">Vista previa renderizada</p>
                <p v-if="currentTemplate.subject" class="text-sm font-semibold text-slate-800 mb-1">{{ renderedSubject }}</p>
                <p class="text-sm text-slate-700 whitespace-pre-line">{{ renderedBody }}</p>
            </div>

            <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
            <p v-if="success" class="text-xs text-emerald-700">{{ success }}</p>
            <p v-if="cooldownRemaining > 0" class="text-xs text-slate-500">
                Espera {{ cooldownRemaining }}s antes de mandar otra notificación.
            </p>
            <p v-if="selectedChannel && !currentChannelConfigured" class="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                El canal <span class="font-mono font-bold">{{ selectedChannel }}</span> no está configurado para tu college. Pide al administrador que cargue las credenciales en AppConfig (<code>notifications.{{ selectedChannel }}</code>).
            </p>

            <div class="flex justify-end gap-2 pt-2">
                <button
                    class="px-4 py-2 text-sm font-bold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="!canSubmit || sending || cooldownRemaining > 0"
                    @click="submit"
                >
                    <template v-if="sending">ENVIANDO...</template>
                    <template v-else-if="cooldownRemaining > 0">ESPERA {{ cooldownRemaining }}s</template>
                    <template v-else>ENVIAR</template>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useToast } from '@/app/composables/useToast'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type {
    NotificationTemplate,
    ChannelInfo,
    NotificationChannel,
    RecipientCandidate,
} from '@/modules/notifications/types/notification.type'
import { useNotificationsStore } from '@/modules/notifications/stores/notifications.store'

const notificationsStore = useNotificationsStore()

const templates = ref<NotificationTemplate[]>([])
const channels  = ref<ChannelInfo[]>([])

const selectedKey     = ref<string>('')
const selectedChannel = ref<NotificationChannel | ''>('')

// Autocompletado de destinatario
const recipientQuery     = ref<string>('')
const recipients         = ref<RecipientCandidate[]>([])
const selectedRecipient  = ref<RecipientCandidate | null>(null)
const searchOpen         = ref(false)
const searchLoading      = ref(false)
const searchRootRef      = ref<HTMLElement>()
let   searchTimer: number | undefined

const vars = reactive<Record<string, string>>({})
const sending = ref(false)
const error   = ref<string | null>(null)
const success = ref<string | null>(null)

// Cooldown anti-spam tras enviar
const COOLDOWN_SECONDS = 10
const cooldownRemaining = ref(0)
let cooldownTimer: number | undefined

function startCooldown() {
    cooldownRemaining.value = COOLDOWN_SECONDS
    if (cooldownTimer) window.clearInterval(cooldownTimer)
    cooldownTimer = window.setInterval(() => {
        cooldownRemaining.value -= 1
        if (cooldownRemaining.value <= 0) {
            cooldownRemaining.value = 0
            if (cooldownTimer) window.clearInterval(cooldownTimer)
        }
    }, 1000)
}

const groupedTemplates = computed(() => {
    const map: Record<string, NotificationTemplate[]> = {}
    for (const t of templates.value) {
        if (!map[t.key]) map[t.key] = []
        map[t.key].push(t)
    }
    return map
})

const availableChannelsForKey = computed(() => groupedTemplates.value[selectedKey.value] ?? [])

const currentTemplate = computed<NotificationTemplate | null>(() =>
    templates.value.find(t => t.key === selectedKey.value && t.channel === selectedChannel.value) ?? null
)

const hasVariables = computed(() => {
    const v = currentTemplate.value?.availableVariables
    return !!v && Object.keys(v).length > 0
})

const renderedSubject = computed(() => render(currentTemplate.value?.subject ?? ''))
const renderedBody    = computed(() => render(currentTemplate.value?.body ?? ''))

const resolvedAddress = computed<string>(() => {
    if (!selectedRecipient.value || !selectedChannel.value) return ''
    return selectedRecipient.value.addressByChannel[selectedChannel.value as NotificationChannel] ?? ''
})

const currentChannelConfigured = computed<boolean>(() => {
    if (!selectedChannel.value) return true
    const ch = channels.value.find(c => c.key === selectedChannel.value)
    return !!ch?.configured
})

const canSubmit = computed(() =>
    !!selectedKey.value && !!selectedChannel.value && !!selectedRecipient.value
    && !!resolvedAddress.value && currentChannelConfigured.value
)

function getVar(path: string): string { return vars[path] ?? '' }
function setVar(path: string, val: string): void { vars[path] = val }

function render(template: string): string {
    return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => vars[key] || `{{${key}}}`)
}

function buildVarsObject(): Record<string, unknown> {
    const out: Record<string, any> = {}
    for (const [path, value] of Object.entries(vars)) {
        const parts = path.split('.')
        let cur = out
        for (let i = 0; i < parts.length - 1; i++) {
            if (!cur[parts[i]]) cur[parts[i]] = {}
            cur = cur[parts[i]]
        }
        cur[parts[parts.length - 1]] = value
    }
    return out
}

function onTemplateChange() {
    selectedChannel.value = ''
    Object.keys(vars).forEach(k => delete vars[k])
    clearRecipient()
}

function clearRecipient() {
    selectedRecipient.value = null
    recipientQuery.value    = ''
    recipients.value        = []
    searchOpen.value        = false
}

function pickRecipient(r: RecipientCandidate) {
    selectedRecipient.value = r
    recipientQuery.value    = r.name
    searchOpen.value        = false
}

function onSearchFocus() {
    if (selectedChannel.value) {
        searchOpen.value = true
        searchRecipients()
    }
}

async function searchRecipients() {
    if (!selectedChannel.value) return
    searchLoading.value = true
    try {
        const { data } = await api.get(API.NOTIFICATIONS_API.recipientSearch, {
            params: {
                q: recipientQuery.value || '',
                channel: selectedChannel.value,
                limit: 15,
            },
        })
        recipients.value = data?.items ?? []
    } catch (e: any) {
        recipients.value = []
        useToast().error(e?.response?.data?.message ?? 'No se pudo buscar destinatarios.')
    } finally {
        searchLoading.value = false
    }
}

watch(recipientQuery, (val) => {
    // Si el usuario edita después de elegir, limpiar selección
    if (selectedRecipient.value && val !== selectedRecipient.value.name) {
        selectedRecipient.value = null
    }
    if (!selectedChannel.value) return
    searchOpen.value = true
    if (searchTimer) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(searchRecipients, 250)
})

watch(selectedChannel, () => {
    clearRecipient()
})

function handleClickOutside(e: MouseEvent) {
    if (searchRootRef.value && !searchRootRef.value.contains(e.target as Node)) {
        searchOpen.value = false
    }
}

function channelLabel(key: NotificationChannel | string): string {
    return channels.value.find(c => c.key === key)?.label ?? key
}

async function load() {
    const [t, c] = await Promise.all([
        api.get(API.NOTIFICATIONS_API.templates),
        api.get(API.NOTIFICATIONS_API.channels),
    ])
    templates.value = t.data?.items ?? []
    channels.value = c.data ?? []
}

async function submit() {
    error.value = null; success.value = null
    if (!canSubmit.value || !selectedRecipient.value || cooldownRemaining.value > 0) return
    sending.value = true
    try {
        const { data } = await api.post(API.NOTIFICATIONS_API.send, {
            template_key:      selectedKey.value,
            channel:           selectedChannel.value,
            recipient_address: resolvedAddress.value,
            recipient_label:   selectedRecipient.value.name,
            recipient_user_id: selectedRecipient.value.userId,
            vars:              buildVarsObject(),
        })
        success.value = `Notificación enviada (id=${data?.id}, status=${data?.status}).`
        // Si el destinatario fui yo mismo y el canal es in-app, la campana
        // debe reflejarlo al instante (sin esperar el polling de 30s).
        if (data?.channel === 'in_app') {
            await notificationsStore.refresh()
        }
        startCooldown()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo enviar.'
    } finally {
        sending.value = false
    }
}

onMounted(() => {
    load()
    document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    if (searchTimer) window.clearTimeout(searchTimer)
    if (cooldownTimer) window.clearInterval(cooldownTimer)
})
</script>
