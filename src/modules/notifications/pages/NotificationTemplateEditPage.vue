<template>
    <div class="space-y-4">
        <div class="flex items-start justify-between flex-wrap gap-2">
            <div>
                <RouterLink :to="{ name: 'notifications.templates' }" class="text-xs text-slate-500 hover:text-blue-600">
                    ← Plantillas
                </RouterLink>
                <h1 class="text-lg font-bold text-slate-800 mt-1">Editar plantilla</h1>
                <p class="text-xs text-slate-500">
                    <span class="font-mono">{{ tplKey }}</span> · canal
                    <span class="font-mono">{{ channel }}</span>
                    <span v-if="data?.override" class="ml-2 text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Override v{{ data.override.version }}</span>
                    <span v-else class="ml-2 text-[10px] uppercase font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">Default</span>
                </p>
            </div>
            <div class="flex gap-2">
                <button
                    v-if="data?.override"
                    class="text-xs px-3 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                    :disabled="saving"
                    @click="confirmReset"
                >Volver al default</button>
                <button
                    class="text-xs px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
                    :disabled="saving || !data"
                    @click="loadDefault"
                >Cargar default en el editor</button>
                <button
                    class="text-xs px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                    :disabled="saving || !canSave"
                    @click="save"
                >{{ saving ? 'GUARDANDO...' : 'GUARDAR OVERRIDE' }}</button>
            </div>
        </div>

        <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
        <p v-if="success" class="text-xs text-emerald-700">{{ success }}</p>

        <div v-if="loading" class="text-sm text-slate-400 italic">Cargando...</div>

        <div v-else-if="data" class="grid lg:grid-cols-2 gap-4">
            <!-- Editor -->
            <div class="space-y-3">
                <div v-if="channel === 'email' || channel === 'in_app'">
                    <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Asunto
                        <span class="text-slate-400 normal-case font-normal">· admite variables</span>
                    </label>
                    <SubjectInputWithVars
                        v-model="form.subject"
                        :variables="data.default.availableVariables"
                        placeholder="Asunto del mensaje (puedes usar variables)..."
                    />
                </div>
                <div>
                    <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Cuerpo
                        <span v-if="channel === 'sms'" class="text-slate-400 normal-case font-normal">· {{ form.body.length }}/160</span>
                        <span v-else-if="channel === 'email'" class="text-slate-400 normal-case font-normal">· HTML enriquecido</span>
                    </label>
                    <EmailRichEditor
                        v-if="channel === 'email'"
                        v-model="form.body"
                        :variables="data.default.availableVariables"
                        placeholder="Escribe el contenido del email..."
                    />
                    <textarea
                        v-else
                        v-model="form.body"
                        rows="10"
                        class="w-full border rounded-md px-2 py-1.5 text-sm font-mono"
                        spellcheck="false"
                    ></textarea>
                </div>
                <label class="flex items-center gap-2 text-xs text-slate-600">
                    <input v-model="form.is_active" type="checkbox" class="rounded border-slate-300 text-indigo-600" />
                    Override activo (si se desactiva, vuelve al default sin perder el contenido)
                </label>

                <div v-if="data.default.availableVariables" class="bg-slate-50 border border-slate-200 rounded-md p-3">
                    <p class="text-[11px] font-bold uppercase text-slate-600 mb-2">Valores de prueba para la vista previa</p>
                    <div class="space-y-2">
                        <div v-for="(desc, key) in data.default.availableVariables" :key="key" class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                            <code class="text-[11px] text-slate-700 font-mono">{{ varToken(key) }}</code>
                            <input
                                :value="getVar(key)"
                                @input="setVar(key, ($event.target as HTMLInputElement).value)"
                                type="text"
                                class="col-span-2 border rounded-md px-2 py-1 text-xs"
                                :placeholder="desc"
                            />
                        </div>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-2">Estos valores son sólo para la vista previa; no se guardan en el override.</p>
                </div>
            </div>

            <!-- Preview + default lado a lado -->
            <div class="space-y-3">
                <div class="bg-white border border-slate-200 rounded-md p-3">
                    <p class="text-[11px] font-bold uppercase text-slate-600 mb-2">Vista previa (override)</p>
                    <div v-if="form.subject" class="text-sm font-bold text-slate-800 mb-1 pb-1 border-b border-slate-100">{{ rendered.subject }}</div>
                    <div v-if="channel === 'email'" class="text-sm text-slate-700 prose prose-sm max-w-none" v-html="rendered.body"></div>
                    <div v-else class="text-sm text-slate-700 whitespace-pre-line">{{ rendered.body }}</div>
                </div>
                <div class="bg-slate-50 border border-slate-200 rounded-md p-3">
                    <p class="text-[11px] font-bold uppercase text-slate-500 mb-2">Default global (referencia)</p>
                    <div v-if="data.default.subject" class="text-xs font-bold text-slate-700 mb-1">{{ data.default.subject }}</div>
                    <div v-if="channel === 'email'" class="text-xs text-slate-600 prose prose-sm max-w-none" v-html="data.default.body"></div>
                    <div v-else class="text-xs text-slate-600 whitespace-pre-line">{{ data.default.body }}</div>
                </div>
            </div>
        </div>

        <!-- Modal confirm reset -->
        <transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
        >
            <div
                v-if="resetOpen"
                class="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
                @click.self="resetOpen = false"
            >
                <div class="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 w-full max-w-sm overflow-hidden">
                    <div class="p-6">
                        <h3 class="text-base font-bold text-slate-800">¿Volver al default?</h3>
                        <p class="text-sm text-slate-500 mt-1">
                            Se eliminará el override del college y la plantilla volverá al valor global. Esto no afecta envíos pasados (siempre llevan snapshot).
                        </p>
                    </div>
                    <div class="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2">
                        <button class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg" :disabled="saving" @click="resetOpen = false">Cancelar</button>
                        <button class="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg" :disabled="saving" @click="resetOverride">{{ saving ? '...' : 'Eliminar override' }}</button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import EmailRichEditor from '@/modules/notifications/components/EmailRichEditor.vue'
import SubjectInputWithVars from '@/modules/notifications/components/SubjectInputWithVars.vue'

interface TemplateDetail {
    key: string
    channel: string
    locale: string
    default: {
        subject: string | null
        body: string
        availableVariables: Record<string, string> | null
    }
    override: {
        id: number
        subject: string | null
        body: string
        isActive: boolean
        version: number
        updatedAt: string | null
    } | null
}

const route   = useRoute()
const tplKey  = computed(() => String(route.params.key))
const channel = computed(() => String(route.params.channel))

const data    = ref<TemplateDetail | null>(null)
const loading = ref(false)
const saving  = ref(false)
const error   = ref<string | null>(null)
const success = ref<string | null>(null)
const resetOpen = ref(false)

const form = reactive({
    subject:   '' as string,
    body:      '' as string,
    is_active: true,
})

const previewVars = reactive<Record<string, string>>({})

const rendered = ref<{ subject: string; body: string }>({ subject: '', body: '' })

const canSave = computed(() => !!data.value && form.body.trim().length > 0)

function getVar(path: string): string { return previewVars[path] ?? '' }
function setVar(path: string, val: string): void { previewVars[path] = val }
function varToken(path: string): string {
    // Construido para evitar que el parser de Vue malinterprete '{{' inline.
    return '{{' + path + '}}'
}

function buildVarsObject(): Record<string, unknown> {
    const out: Record<string, any> = {}
    for (const [path, value] of Object.entries(previewVars)) {
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

async function load() {
    loading.value = true
    error.value = null
    try {
        const { data: d } = await api.get(API.NOTIFICATIONS_API.templateShow(tplKey.value, channel.value))
        data.value = d
        form.subject   = (d.override?.subject ?? d.default.subject) ?? ''
        form.body      = d.override?.body ?? d.default.body
        form.is_active = d.override?.isActive ?? true
        await renderPreview()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar la plantilla.'
    } finally {
        loading.value = false
    }
}

async function renderPreview() {
    try {
        const { data: r } = await api.post(API.NOTIFICATIONS_API.templatePreview, {
            subject: form.subject,
            body:    form.body,
            vars:    buildVarsObject(),
        })
        rendered.value = { subject: r.subject ?? '', body: r.body ?? '' }
    } catch { /* preview es best-effort */ }
}

function loadDefault() {
    if (!data.value) return
    form.subject = data.value.default.subject ?? ''
    form.body    = data.value.default.body
}

async function save() {
    error.value = null; success.value = null
    if (!canSave.value) return
    saving.value = true
    try {
        await api.post(API.NOTIFICATIONS_API.templateUpsert, {
            key:       tplKey.value,
            channel:   channel.value,
            locale:    'es',
            subject:   form.subject || null,
            body:      form.body,
            is_active: form.is_active,
        })
        success.value = 'Override guardado.'
        await load()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo guardar.'
    } finally {
        saving.value = false
    }
}

function confirmReset() { resetOpen.value = true }

async function resetOverride() {
    if (saving.value) return
    saving.value = true
    try {
        await api.delete(API.NOTIFICATIONS_API.templateDelete(tplKey.value, channel.value))
        resetOpen.value = false
        success.value = 'Override eliminado, ahora se usa el default.'
        await load()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo eliminar.'
    } finally {
        saving.value = false
    }
}

let renderTimer: number | undefined
watch([() => form.subject, () => form.body, previewVars], () => {
    if (renderTimer) window.clearTimeout(renderTimer)
    renderTimer = window.setTimeout(renderPreview, 200)
}, { deep: true })

onMounted(load)
</script>
