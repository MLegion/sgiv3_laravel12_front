<template>
    <Teleport to="body">
        <div
            class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
            aria-live="polite"
            aria-relevant="additions"
        >
            <TransitionGroup
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 translate-x-4"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition duration-150 ease-in absolute w-full"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0 translate-x-4"
            >
                <div
                    v-for="t in toasts"
                    :key="t.id"
                    class="pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg"
                    :class="border(t.variant)"
                    :role="t.variant === 'error' ? 'alert' : 'status'"
                >
                    <!-- Icono por variante -->
                    <span
                        class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        :class="iconWrap(t.variant)"
                    >
                        <svg
                            v-if="t.variant === 'success'"
                            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            stroke-width="2" stroke="currentColor" class="h-4 w-4"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <svg
                            v-else-if="t.variant === 'error'"
                            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            stroke-width="2" stroke="currentColor" class="h-4 w-4"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <svg
                            v-else-if="t.variant === 'warning'"
                            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            stroke-width="2" stroke="currentColor" class="h-4 w-4"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008M10.34 3.94l-8.4 14.55A1.5 1.5 0 003.24 21h17.52a1.5 1.5 0 001.3-2.51L13.66 3.94a1.5 1.5 0 00-2.6 0z" />
                        </svg>
                        <svg
                            v-else
                            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            stroke-width="2" stroke="currentColor" class="h-4 w-4"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25h.75v4.5m-.75 0h1.5M12 7.5h.008v.008H12V7.5z" />
                        </svg>
                    </span>

                    <!-- Texto -->
                    <div class="min-w-0 flex-1">
                        <p v-if="t.title" class="text-sm font-semibold text-slate-800">
                            {{ t.title }}
                        </p>
                        <p class="text-sm text-slate-600 break-words">
                            {{ t.message }}
                        </p>
                    </div>

                    <!-- Cerrar -->
                    <button
                        type="button"
                        class="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        :aria-label="`Cerrar notificación: ${t.title || t.message}`"
                        @click="dismiss(t.id)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { useToast, type ToastVariant } from '@/app/composables/useToast'

const { toasts, dismiss } = useToast()

function border(v: ToastVariant): string {
    switch (v) {
        case 'success': return 'border-emerald-200'
        case 'error':   return 'border-red-200'
        case 'warning': return 'border-amber-200'
        default:        return 'border-blue-200'
    }
}

function iconWrap(v: ToastVariant): string {
    switch (v) {
        case 'success': return 'bg-emerald-100 text-emerald-600'
        case 'error':   return 'bg-red-100 text-red-600'
        case 'warning': return 'bg-amber-100 text-amber-600'
        default:        return 'bg-blue-100 text-blue-600'
    }
}
</script>
