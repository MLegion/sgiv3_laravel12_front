<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-opacity duration-150 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <!-- Overlay -->
                <div class="absolute inset-0 bg-black/40" @click="onOverlay" />

                <!-- Diálogo -->
                <div
                    ref="dialogEl"
                    role="dialog"
                    aria-modal="true"
                    :aria-labelledby="title ? titleId : undefined"
                    class="relative z-10 flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-xl bg-white shadow-xl"
                    :class="sizeClass"
                    @keydown="onKeydown"
                >
                    <!-- Header -->
                    <div
                        v-if="title || $slots.header"
                        class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-4"
                    >
                        <slot name="header">
                            <h3 :id="titleId" class="text-base font-semibold text-slate-800">
                                {{ title }}
                            </h3>
                        </slot>
                        <button
                            v-if="!hideClose"
                            type="button"
                            class="-mr-2 -mt-1 shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            aria-label="Cerrar"
                            @click="close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Cuerpo (con scroll) -->
                    <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <slot />
                    </div>

                    <!-- Footer -->
                    <div
                        v-if="$slots.footer"
                        class="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4"
                    >
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

/**
 * Shell de modal accesible. Resuelve el problema sistémico S5: modales custom
 * con Teleport sin role/aria-modal/focus-trap/Escape.
 *
 * Provee: role="dialog", aria-modal, aria-labelledby, cierre con Escape,
 * cierre al click en overlay, foco inicial dentro del modal, trampa de foco
 * (Tab cíclico) y restauración del foco previo al cerrar.
 *
 * Slots: default (cuerpo), header (opcional, reemplaza el título), footer (acciones).
 */

type Size = 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(defineProps<{
    modelValue: boolean
    title?: string
    size?: Size
    /** Si true, el click en el overlay NO cierra (útil en formularios con cambios). */
    persistent?: boolean
    hideClose?: boolean
}>(), {
    size: 'md',
    persistent: false,
    hideClose: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'close'): void
}>()

let uid = 0
const titleId = `modal-title-${++uid}-${Math.floor(Math.random() * 1e6)}`

const dialogEl = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const sizeClass = computed(() => {
    switch (props.size) {
        case 'sm': return 'max-w-sm'
        case 'lg': return 'max-w-2xl'
        case 'xl': return 'max-w-4xl'
        default:   return 'max-w-md'
    }
})

function close(): void {
    emit('update:modelValue', false)
    emit('close')
}

function onOverlay(): void {
    if (!props.persistent) close()
}

function focusable(): HTMLElement[] {
    if (!dialogEl.value) return []
    return Array.from(
        dialogEl.value.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
    )
}

function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
        e.stopPropagation()
        close()
        return
    }
    if (e.key !== 'Tab') return

    const items = focusable()
    if (items.length === 0) {
        e.preventDefault()
        dialogEl.value?.focus()
        return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement as HTMLElement | null

    if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
    } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
    }
}

watch(() => props.modelValue, (open) => {
    if (open) {
        previouslyFocused = document.activeElement as HTMLElement | null
        nextTick(() => {
            const items = focusable()
            ;(items[0] ?? dialogEl.value)?.focus()
        })
    } else {
        previouslyFocused?.focus?.()
        previouslyFocused = null
    }
})
</script>
