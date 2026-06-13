<template>
    <div class="relative" ref="rootRef">
        <button :aria-label="`${store.unreadCount} sin leer`"
            type="button"
            class="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            :class="{ 'bg-slate-100': open }"
            @click="toggle"
            :title="`${store.unreadCount} sin leer`"
        >
            <BellIcon class="w-6 h-6" />
            <span
                v-if="store.unreadCount > 0"
                class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                :class="{ 'notif-bell-pulse': pulsing }"
            >{{ store.unreadCount > 99 ? '99+' : store.unreadCount }}</span>
        </button>

        <transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0 scale-95 -translate-y-1"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
            <div
                v-if="open"
                class="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 overflow-hidden z-[90]"
            >
                <div class="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                    <p class="text-xs font-bold uppercase tracking-wide text-slate-700">Notificaciones</p>
                    <div class="flex items-center gap-2">
                        <button :aria-label="pushTitle"
                            v-if="webPush.supported.value"
                            type="button"
                            class="p-1 rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            :class="{ 'text-indigo-600': webPush.status.value === 'subscribed' }"
                            :disabled="webPush.loading.value || webPush.status.value === 'denied'"
                            :title="pushTitle"
                            @click="togglePush"
                        >
                            <BellAlertIcon v-if="webPush.status.value === 'subscribed'" class="w-4 h-4" />
                            <BellSlashIcon v-else                                       class="w-4 h-4" />
                        </button>
                        <button :aria-label="store.soundEnabled ? 'Sonido activado (click para silenciar)' : 'Sonido silenciado (click para activar)'"
                            type="button"
                            class="p-1 rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                            :class="{ 'text-indigo-600': store.soundEnabled }"
                            :title="store.soundEnabled ? 'Sonido activado (click para silenciar)' : 'Sonido silenciado (click para activar)'"
                            @click="store.toggleSound"
                        >
                            <SpeakerWaveIcon  v-if="store.soundEnabled"  class="w-4 h-4" />
                            <SpeakerXMarkIcon v-else                     class="w-4 h-4" />
                        </button>
                        <button
                            v-if="store.unreadCount > 0"
                            class="text-[11px] text-indigo-600 hover:underline"
                            @click="store.markAllRead"
                        >Marcar todas como leídas</button>
                    </div>
                </div>

                <p v-if="webPush.error.value" class="px-4 py-2 text-[11px] text-rose-600 bg-rose-50 border-b border-rose-100">
                    {{ webPush.error.value }}
                </p>

                <div class="max-h-96 overflow-y-auto">
                    <div v-if="store.loading && store.items.length === 0" class="p-6 text-center text-xs text-slate-400 italic">
                        Cargando...
                    </div>
                    <div v-else-if="store.items.length === 0" class="p-6 text-center text-xs text-slate-400 italic">
                        No hay notificaciones.
                    </div>
                    <ul v-else class="divide-y divide-slate-100">
                        <li
                            v-for="n in store.items"
                            :key="n.id"
                            class="group relative px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                            :class="{ 'bg-indigo-50/50': !n.read_at }"
                            @click="onClick(n)"
                        >
                            <div class="flex items-start gap-2.5">
                                <div
                                    class="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 relative"
                                    :class="iconClassForEvent(n.event_key ?? null)"
                                >
                                    <component :is="iconForEvent(n.event_key ?? null)" class="w-3.5 h-3.5" />
                                    <span
                                        v-if="!n.read_at"
                                        class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white"
                                    />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-sm font-semibold text-slate-800 truncate pr-12">
                                        {{ n.subject || '(sin asunto)' }}
                                    </p>
                                    <p class="text-xs text-slate-600 mt-0.5 line-clamp-2">{{ n.body_rendered }}</p>
                                    <p class="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                                        <span>{{ moduleLabelForEvent(n.event_key ?? null) }}</span>
                                        <span class="text-slate-300">·</span>
                                        <span>{{ formatRelative(n.created_at) }}</span>
                                    </p>
                                </div>
                            </div>

                            <div class="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                <button aria-label="Marcar como leída"
                                    v-if="!n.read_at"
                                    type="button"
                                    class="p-1 rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                    title="Marcar como leída"
                                    @click.stop="store.markRead(n.id)"
                                >
                                    <CheckIcon class="w-3.5 h-3.5" />
                                </button>
                                <button aria-label="Descartar"
                                    type="button"
                                    class="p-1 rounded text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                                    title="Descartar"
                                    @click.stop="store.remove(n.id)"
                                >
                                    <XMarkIcon class="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </li>
                    </ul>
                </div>

                <div class="border-t border-slate-100 px-4 py-2 bg-slate-50/50 text-center">
                    <RouterLink
                        :to="{ name: 'notifications.inbox' }"
                        class="text-xs font-semibold text-indigo-600 hover:underline"
                        @click="open = false"
                    >Ver todas mis notificaciones</RouterLink>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
    BellIcon, BellAlertIcon, BellSlashIcon,
    SpeakerWaveIcon, SpeakerXMarkIcon,
    CheckIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useNotificationsStore } from '@/modules/notifications/stores/notifications.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useWebPush } from '@/modules/notifications/composables/useWebPush'
import {
    iconForEvent,
    iconClassForEvent,
    moduleLabelForEvent,
} from '@/modules/notifications/utils/notificationVisuals'
import type { NotificationItem } from '@/modules/notifications/types/notification.type'

const store     = useNotificationsStore()
const auth      = useAuthStore()
const webPush   = useWebPush()
const open      = ref(false)
const rootRef   = ref<HTMLElement>()
const pulsing   = ref(false)

let pollHandle: number | undefined
let pulseHandle: number | undefined

// Pulso visual del badge cuando sube el contador (notif nueva entró).
watch(() => store.unreadCount, (next, prev) => {
    if (next > (prev ?? 0)) {
        pulsing.value = true
        if (pulseHandle) window.clearTimeout(pulseHandle)
        pulseHandle = window.setTimeout(() => { pulsing.value = false }, 1200)
    }
})

const pushTitle = computed(() => {
    if (webPush.status.value === 'subscribed') return 'Notificaciones push activas (click para desactivar)'
    if (webPush.status.value === 'denied')     return 'Bloqueadas en este navegador. Habilítalas en la configuración del sitio.'
    return 'Activar notificaciones push (incluso con la pestaña cerrada)'
})

async function togglePush() {
    if (webPush.status.value === 'subscribed') {
        await webPush.disable()
    } else {
        await webPush.enable()
    }
}

async function toggle() {
    open.value = !open.value
    if (open.value) {
        await store.refresh()
    }
}

async function onClick(n: NotificationItem) {
    if (!n.read_at) await store.markRead(n.id)
}

function handleClickOutside(e: MouseEvent) {
    if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
        open.value = false
    }
}

function formatRelative(iso: string): string {
    if (!iso) return ''
    const ms = Date.now() - new Date(iso).getTime()
    const min = Math.round(ms / 60000)
    if (min < 1) return 'ahora'
    if (min < 60) return `hace ${min} min`
    const hr = Math.round(min / 60)
    if (hr < 24) return `hace ${hr} h`
    const days = Math.round(hr / 24)
    if (days < 30) return `hace ${days} d`
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

onMounted(() => {
    store.refreshCount()
    // Polling fallback cada 30s — sigue siendo útil si el WS se cae.
    pollHandle = window.setInterval(() => store.refreshCount(), 30000)
    // Realtime: suscribir al canal privado del usuario actual.
    if (auth.user?.id) {
        store.subscribeRealtime(auth.user.id)
    }
    // Lee estado actual de la suscripción push del navegador (sin pedir permiso).
    webPush.refreshStatus()
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    if (pollHandle) window.clearInterval(pollHandle)
    if (pulseHandle) window.clearTimeout(pulseHandle)
    store.unsubscribeRealtime()
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
@keyframes notif-bell-pulse-kf {
    0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
    60%  { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
    100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
.notif-bell-pulse {
    animation: notif-bell-pulse-kf 1.1s ease-out 1;
}
</style>
