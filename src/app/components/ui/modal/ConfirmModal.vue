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
                class="relative bg-white rounded-xl shadow-lg
                       w-full max-w-md p-6 space-y-4 z-10"
            >
                <!-- Icon -->
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 flex items-center justify-center
                               rounded-full bg-amber-100 text-amber-600"
                    >
                        <!-- Warning icon -->
                        <svg
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

                    <h3 class="text-sm font-semibold text-slate-800">
                        {{ title }}
                    </h3>
                </div>

                <!-- Message -->
                <p class="text-sm text-slate-600">
                    {{ message }}
                </p>

                <!-- Actions -->
                <div class="flex justify-end gap-2 pt-4">
                    <button
                        class="px-3 py-2 text-sm border rounded-lg
                               hover:bg-slate-100"
                        @click="cancel"
                    >
                        Cancelar
                    </button>

                    <button
                        class="px-4 py-2 text-sm rounded-lg
                               bg-blue-600 text-white hover:bg-blue-700"
                        @click="confirm"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean
    title?: string
    message?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm'): void
}>()

function cancel() {
    emit('update:modelValue', false)
}

function confirm() {
    emit('confirm')
    emit('update:modelValue', false)
}
</script>
