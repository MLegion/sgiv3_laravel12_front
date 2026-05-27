<template>
    <Teleport to="body">
        <div
            class="fixed right-4 top-4 z-[100] flex flex-col gap-2 pointer-events-none"
            aria-live="polite"
        >
            <TransitionGroup
                enter-active-class="transition ease-out duration-200"
                enter-from-class="opacity-0 translate-x-4"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 translate-x-4"
            >
                <article
                    v-for="t in visible"
                    :key="t.id"
                    class="pointer-events-auto w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                    role="alert"
                    @click="open(t)"
                    @mouseenter="pause(t.id)"
                    @mouseleave="resume(t.id)"
                >
                    <div class="px-3 py-2.5 flex items-start gap-2.5">
                        <div
                            class="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            :class="iconClassForEvent(t.event_key)"
                        >
                            <component :is="iconForEvent(t.event_key)" class="w-4 h-4" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-semibold text-slate-800 truncate">
                                {{ t.subject || '(sin asunto)' }}
                            </p>
                            <p class="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                                {{ t.body || '' }}
                            </p>
                            <p class="text-[10px] text-slate-400 mt-1">{{ moduleLabelForEvent(t.event_key) }}</p>
                        </div>
                        <button
                            type="button"
                            class="text-slate-400 hover:text-slate-700 flex-shrink-0 p-1 -m-1"
                            :aria-label="`Descartar notificación ${t.subject || ''}`"
                            @click.stop="dismiss(t.id)"
                        >
                            <XMarkIcon class="w-4 h-4" />
                        </button>
                    </div>
                    <div class="h-0.5 bg-slate-100 overflow-hidden">
                        <div
                            class="h-full bg-indigo-500 origin-left"
                            :style="{
                                animation: t.paused ? 'none' : `notif-toast-bar ${AUTO_DISMISS_MS}ms linear forwards`,
                            }"
                        />
                    </div>
                </article>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useNotificationsStore } from '@/modules/notifications/stores/notifications.store'
import { useWebPush } from '@/modules/notifications/composables/useWebPush'
import {
    iconForEvent,
    iconClassForEvent,
    moduleLabelForEvent,
} from '@/modules/notifications/utils/notificationVisuals'

interface Toast {
    id:        number
    subject:   string | null
    body:      string | null
    event_key: string | null
    paused:    boolean
}

const AUTO_DISMISS_MS = 6000
const MAX_STACKED     = 3

const store   = useNotificationsStore()
const router  = useRouter()
const webPush = useWebPush()

const { lastIncoming, items } = storeToRefs(store)

const visible = ref<Toast[]>([])
const timers  = new Map<number, ReturnType<typeof setTimeout>>()
const remaining = new Map<number, { startedAt: number; remaining: number }>()

watch(lastIncoming, (incoming) => {
    if (! incoming) return

    // Si el usuario tiene Web Push activo, el navegador ya muestra una
    // notificación del SO con el mismo contenido; evitamos duplicar dentro
    // de la app (mismo motivo por el cual el sonido se silencia).
    if (webPush.status.value === 'subscribed') return

    if (visible.value.some(t => t.id === incoming.id)) return

    // El store ya hizo refresh() antes de actualizar lastIncoming, así que
    // items[0] suele ser la misma notif. Tomamos el body de ahí si coincide.
    const matched = items.value.find(i => i.id === incoming.id)

    const toast: Toast = {
        id:        incoming.id,
        subject:   incoming.subject ?? matched?.subject ?? null,
        body:      matched?.body_rendered ?? null,
        event_key: incoming.event_key,
        paused:    false,
    }

    visible.value.unshift(toast)
    if (visible.value.length > MAX_STACKED) {
        const removed = visible.value.pop()
        if (removed) clearTimer(removed.id)
    }
    scheduleDismiss(toast.id, AUTO_DISMISS_MS)
})

function scheduleDismiss(id: number, ms: number): void {
    clearTimer(id)
    remaining.set(id, { startedAt: Date.now(), remaining: ms })
    const handle = setTimeout(() => dismiss(id), ms)
    timers.set(id, handle)
}

function clearTimer(id: number): void {
    const h = timers.get(id)
    if (h) clearTimeout(h)
    timers.delete(id)
}

function pause(id: number): void {
    const r = remaining.get(id)
    if (! r) return
    const elapsed = Date.now() - r.startedAt
    const left    = Math.max(0, r.remaining - elapsed)
    remaining.set(id, { startedAt: Date.now(), remaining: left })
    clearTimer(id)
    const t = visible.value.find(x => x.id === id)
    if (t) t.paused = true
}

function resume(id: number): void {
    const r = remaining.get(id)
    if (! r) return
    const t = visible.value.find(x => x.id === id)
    if (t) t.paused = false
    scheduleDismiss(id, r.remaining)
}

function dismiss(id: number): void {
    visible.value = visible.value.filter(t => t.id !== id)
    clearTimer(id)
    remaining.delete(id)
}

function open(toast: Toast): void {
    dismiss(toast.id)
    store.markRead(toast.id).finally(() => {
        router.push({ name: 'notifications.inbox' }).catch(() => {})
    })
}
</script>

<style>
@keyframes notif-toast-bar {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
}
</style>
