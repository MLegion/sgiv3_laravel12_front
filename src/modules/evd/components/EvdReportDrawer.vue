<template>
    <div v-if="open" class="fixed inset-0 z-[120] flex justify-end" @keydown.esc="close">
        <div class="absolute inset-0 bg-black/40" @click="close"></div>

        <div class="relative bg-white w-full max-w-3xl h-full shadow-xl flex flex-col">
            <!-- Encabezado -->
            <div class="flex items-center justify-between px-5 py-3 border-b bg-slate-50">
                <div class="min-w-0">
                    <h2 class="text-sm font-bold text-slate-800 uppercase truncate">Reporte de evaluación</h2>
                    <p class="text-[11px] text-slate-400 truncate">{{ subtitle }}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button
                        v-if="pdfUrl"
                        class="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        @click="download"
                    >Descargar</button>
                    <button class="text-slate-400 hover:text-slate-600 p-1" aria-label="Cerrar" @click="close">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Cuerpo -->
            <div class="relative flex-1 bg-slate-100">
                <div v-if="loading" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
                    <svg class="animate-spin w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    <span class="text-xs">Generando reporte…</span>
                </div>
                <div v-else-if="error" class="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-red-600">{{ error }}</div>
                <iframe v-show="pdfUrl && !loading && !error" :src="pdfUrl ?? undefined" class="w-full h-full border-0" title="Reporte"></iframe>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useReportGenerator, ReportFormatUnavailableError } from '@/modules/reports/composables/useReportGenerator'
import { ReportCode } from '@/modules/reports/types/reportCodes'

const props = defineProps<{
    open: boolean
    cap: number | null
    teacherId: number | null
    teacherName?: string | null
    campusId?: number | null
    modalityTypeId?: number | null
}>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { renderPdf } = useReportGenerator()
const loading = ref(false)
const error = ref('')
const pdfUrl = ref<string | null>(null)
let lastBlob: Blob | null = null

const subtitle = computed(() => props.teacherName || '')

function revoke() {
    if (pdfUrl.value) { URL.revokeObjectURL(pdfUrl.value); pdfUrl.value = null }
    lastBlob = null
}

async function generate() {
    if (props.cap === null || props.teacherId === null) {
        error.value = 'Falta el periodo o el docente.'
        return
    }
    loading.value = true
    error.value = ''
    revoke()
    try {
        const { blob } = await renderPdf({
            reportCode: ReportCode.TEACHER_EVALUATION,
            params: {
                cap:              props.cap,
                teacher_id:       props.teacherId,
                modality_type_id: props.modalityTypeId ?? undefined,
                campus_id:        props.campusId ?? undefined,
            },
        })
        lastBlob = blob
        pdfUrl.value = URL.createObjectURL(blob)
    } catch (e: any) {
        error.value = e instanceof ReportFormatUnavailableError
            ? (e.message ?? 'El formato del reporte no está disponible.')
            : (e?.message ?? 'No se pudo generar el reporte.')
    } finally {
        loading.value = false
    }
}

function download() {
    if (!lastBlob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(lastBlob)
    a.download = `evaluacion-docente-${props.teacherId ?? ''}.pdf`
    a.click()
    URL.revokeObjectURL(a.href)
}

function close() { emit('close') }

watch(() => props.open, (isOpen) => {
    if (isOpen) generate()
    else revoke()
})
onBeforeUnmount(revoke)
</script>
