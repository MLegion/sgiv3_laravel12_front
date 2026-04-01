<template>
    <div class="flex flex-col items-center gap-4">

        <!-- Avatar -->
        <div
            class="relative w-32 h-32 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 cursor-pointer group"
            @click="openFilePicker"
        >
            <!-- Skeleton mientras carga la foto actual -->
            <div
                v-if="fetchingCurrent"
                class="w-full h-full bg-slate-200 animate-pulse"
            ></div>

            <!-- Foto actual o preview -->
            <img
                v-else-if="previewUrl || fetchedUrl"
                :src="previewUrl ?? fetchedUrl!"
                class="w-full h-full object-cover"
                alt="Foto"
            />

            <!-- Placeholder -->
            <div v-else class="w-full h-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-14 h-14 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
            </div>

            <!-- Overlay al hacer hover -->
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
        </div>

        <p class="text-xs text-slate-400">Haz clic en la foto para cambiarla</p>

        <!-- Input oculto -->
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelected" />

        <!-- Modal de recorte -->
        <Teleport to="body">
            <div
                v-if="cropModalOpen"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            >
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4 p-6">
                    <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest">Recortar Foto</h3>

                    <!-- Cropper -->
                    <div class="w-full aspect-square rounded-xl overflow-hidden bg-slate-900">
                        <Cropper
                            ref="cropperRef"
                            :src="rawImageUrl"
                            :stencil-props="{ aspectRatio: 1 }"
                            :stencil-component="CircleStencil"
                            class="w-full h-full"
                        />
                    </div>

                    <div class="flex justify-end gap-2 pt-2 border-t">
                        <button
                            class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50"
                            @click="cancelCrop"
                        >
                            CANCELAR
                        </button>
                        <button
                            class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            @click="confirmCrop"
                        >
                            CONFIRMAR
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Cropper, CircleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { api } from '@/shared/services/api'

interface Props {
    currentUrl?: string | null
}

const props = withDefaults(defineProps<Props>(), {
    currentUrl: null,
})

const emit = defineEmits<{
    change: [file: File]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)
const cropModalOpen = ref(false)
const rawImageUrl = ref<string>('')
const previewUrl = ref<string | null>(null)
const fetchedUrl = ref<string | null>(null)
const fetchingCurrent = ref(false)

async function fetchCurrentPhoto() {
    if (!props.currentUrl) { fetchedUrl.value = null; return }
    fetchingCurrent.value = true
    try {
        const res = await api.get(props.currentUrl, { responseType: 'blob' })
        if (fetchedUrl.value) URL.revokeObjectURL(fetchedUrl.value)
        fetchedUrl.value = URL.createObjectURL(res.data)
    } catch (e: any) {
        console.error('[PhotoUpload] Error cargando foto:', e?.response?.status, e?.message)
        fetchedUrl.value = null
    } finally {
        fetchingCurrent.value = false
    }
}

watch(() => props.currentUrl, fetchCurrentPhoto)
onMounted(fetchCurrentPhoto)
onUnmounted(() => { if (fetchedUrl.value) URL.revokeObjectURL(fetchedUrl.value) })

function openFilePicker() {
    fileInput.value?.click()
}

function onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    // Limpiar input para permitir re-seleccionar el mismo archivo
    ;(event.target as HTMLInputElement).value = ''

    rawImageUrl.value = URL.createObjectURL(file)
    cropModalOpen.value = true
}

function cancelCrop() {
    cropModalOpen.value = false
    URL.revokeObjectURL(rawImageUrl.value)
    rawImageUrl.value = ''
}

function confirmCrop() {
    if (!cropperRef.value) return

    const { canvas } = cropperRef.value.getResult()
    if (!canvas) return

    canvas.toBlob((blob) => {
        if (!blob) return

        // Preview
        if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = URL.createObjectURL(blob)

        // Emitir archivo listo para subir
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
        emit('change', file)

        cropModalOpen.value = false
        URL.revokeObjectURL(rawImageUrl.value)
        rawImageUrl.value = ''
    }, 'image/jpeg', 0.9)
}
</script>
