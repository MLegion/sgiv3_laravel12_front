<template>
    <div class="border rounded-lg p-4">
        <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
                <p class="text-sm font-medium text-gray-700">{{ label }}</p>
                <p class="text-xs text-gray-500 mt-0.5">PNG, JPG, SVG o WEBP, máximo 2MB.</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    class="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                    :disabled="uploading"
                    @click="pick"
                >
                    {{ currentUrl ? 'Reemplazar' : 'Subir' }}
                </button>
                <button
                    v-if="currentUrl"
                    type="button"
                    class="text-xs px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50"
                    :disabled="uploading"
                    @click="$emit('delete')"
                >
                    Eliminar
                </button>
            </div>
        </div>

        <div v-if="currentUrl" class="mt-3 border rounded bg-gray-50 p-3 flex items-center justify-center">
            <img :src="currentUrl" :alt="label" class="max-h-32 max-w-full object-contain" />
        </div>
        <div v-else class="mt-3 border-2 border-dashed rounded p-6 text-center text-xs text-gray-400">
            Sin imagen
        </div>

        <input
            ref="fileInput"
            type="file"
            class="hidden"
            :accept="accept"
            @change="onChange"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
    label: string
    currentUrl: string | null
    uploading: boolean
    accept: string
}>()

const emit = defineEmits<{
    upload: [file: File]
    delete: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function pick() {
    fileInput.value?.click()
}

function onChange(e: Event) {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
        emit('upload', file)
    }
    target.value = ''
}
</script>
