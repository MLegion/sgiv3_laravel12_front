<template>
    <Teleport to="body">
        <div
            v-if="modelValue"
            class="fixed inset-0 z-50 flex items-center justify-center"
        >
            <!-- Overlay -->
            <div
                class="absolute inset-0 bg-black/40"
                @click="cancel"
            />

            <!-- Modal -->
            <div
                ref="modalEl"
                role="dialog"
                aria-modal="true"
                :aria-labelledby="titleId"
                tabindex="-1"
                class="relative bg-white rounded-xl shadow-lg
                       w-full max-w-md p-6 space-y-4 z-10 focus:outline-none"
                @keydown.esc.stop="cancel"
            >
                <!-- Icon -->
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 flex items-center justify-center rounded-full"
                        :class="iconWrapperClass"
                    >
                        <svg
                            v-if="variant === 'info'"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                            />
                        </svg>
                        <svg
                            v-else-if="variant === 'success'"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <!-- warning (default) -->
                        <svg
                            v-else
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M12 9v3.75m0 3h.008M3.75 19.5h16.5
                                   a1.875 1.875 0 001.623-2.812L13.623
                                   4.688a1.875 1.875 0 00-3.246 0L2.127
                                   16.688A1.875 1.875 0 003.75 19.5z"
                            />
                        </svg>
                    </div>

                    <h3 :id="titleId" class="text-sm font-semibold text-slate-800">
                        {{ title }}
                    </h3>
                </div>

                <!-- Message -->
                <p class="text-sm text-slate-600 whitespace-pre-line">
                    {{ message }}
                </p>

                <!-- Actions -->
                <div class="flex justify-end gap-2 pt-4">
                    <button
                        v-if="!hideCancel"
                        class="px-3 py-2 text-sm border rounded-lg
                               hover:bg-slate-100"
                        @click="cancel"
                    >
                        {{ cancelText ?? 'Cancelar' }}
                    </button>

                    <button
                        ref="confirmBtn"
                        class="px-4 py-2 text-sm rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-1"
                        :class="confirmBtnClass"
                        @click="confirm"
                    >
                        {{ confirmText ?? 'Confirmar' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

type Variant = 'warning' | 'info' | 'success' | 'danger'

const titleId = `confirm-modal-${Math.floor(Math.random() * 1e9)}`
const modalEl = ref<HTMLElement | null>(null)
const confirmBtn = ref<HTMLElement | null>(null)

const props = withDefaults(defineProps<{
    modelValue: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    hideCancel?: boolean
    variant?: Variant
}>(), {
    variant: 'warning',
    hideCancel: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm'): void
}>()

const iconWrapperClass = computed(() => {
    switch (props.variant) {
        case 'info':    return 'bg-blue-100 text-blue-600'
        case 'success': return 'bg-emerald-100 text-emerald-600'
        case 'danger':  return 'bg-red-100 text-red-600'
        default:        return 'bg-amber-100 text-amber-600'
    }
})

const confirmBtnClass = computed(() => {
    switch (props.variant) {
        case 'success': return 'bg-emerald-600 hover:bg-emerald-700'
        case 'info':    return 'bg-blue-600 hover:bg-blue-700'
        case 'danger':  return 'bg-red-600 hover:bg-red-700'
        default:        return 'bg-blue-600 hover:bg-blue-700'
    }
})

watch(() => props.modelValue, (open) => {
    if (open) {
        nextTick(() => (confirmBtn.value ?? modalEl.value)?.focus())
    }
})

function cancel() {
    emit('update:modelValue', false)
}

function confirm() {
    emit('confirm')
    emit('update:modelValue', false)
}
</script>
