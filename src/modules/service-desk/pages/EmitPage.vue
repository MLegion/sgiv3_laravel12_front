<template>
    <div class="space-y-5 max-w-6xl mx-auto">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Emitir constancia</h1>
                <p class="text-xs text-slate-400">Busca al estudiante, elige el documento y revisa la vista previa antes de emitir.</p>
            </div>
        </div>

        <!-- Sin estudiante: estado vacío con búsqueda -->
        <div v-if="!summary" class="bg-white border-2 border-dashed border-slate-200 rounded-2xl px-6 py-12 text-center">
            <div class="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 text-blue-500">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" />
                </svg>
            </div>
            <p class="text-sm text-slate-600 font-medium">Selecciona al estudiante para la constancia</p>
            <p class="text-xs text-slate-400 mt-1 mb-4">Puedes filtrar por campus, modalidad, carrera o estatus.</p>
            <button
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
                @click="pickerOpen = true"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.34-4.34m0 0A7 7 0 1 0 6.34 6.34a7 7 0 0 0 10.32 10.32Z" />
                </svg>
                Buscar estudiante
            </button>
            <p v-if="msg && msgError" class="text-sm text-red-600 mt-3">{{ msg }}</p>
        </div>

        <!-- Estudiante seleccionado: 2 columnas (config | vista previa) -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <!-- Columna izquierda: estudiante + documento -->
            <div class="space-y-5">
                <!-- Tarjeta del estudiante -->
                <div class="bg-white border rounded-2xl shadow-sm overflow-hidden">
                    <div class="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-white">
                        <div class="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
                            {{ initials }}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-bold text-slate-800 text-lg leading-tight">{{ summary.full_name }}</div>
                            <div class="text-xs text-slate-500 mt-0.5">
                                <span class="font-mono font-semibold">{{ summary.num_control }}</span>
                                <span class="mx-1.5 text-slate-300">·</span>
                                {{ summary.career_name ?? '—' }}
                            </div>
                        </div>
                        <button class="text-xs font-semibold text-blue-600 hover:underline shrink-0" @click="pickerOpen = true">
                            Cambiar estudiante
                        </button>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-t text-center">
                        <div class="p-3"><div class="text-[10px] uppercase text-slate-400">Estatus</div><div class="text-sm font-semibold text-slate-700">{{ summary.status_name ?? '—' }}</div></div>
                        <div class="p-3"><div class="text-[10px] uppercase text-slate-400">Semestre</div><div class="text-sm font-semibold text-slate-700">{{ summary.semester ?? '—' }}</div></div>
                        <div class="p-3"><div class="text-[10px] uppercase text-slate-400">Promedio</div><div class="text-sm font-semibold text-slate-700">{{ summary.promedio ?? 'N/D' }}</div></div>
                        <div class="p-3"><div class="text-[10px] uppercase text-slate-400">Créditos</div><div class="text-sm font-semibold text-slate-700">{{ summary.creditos ?? '—' }}</div></div>
                    </div>
                </div>

                <!-- Documento a emitir -->
                <div class="bg-white border rounded-2xl shadow-sm p-5 space-y-4">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wide">Documento a emitir</span>
                    <div class="grid sm:grid-cols-2 gap-2.5">
                        <label
                            v-for="d in documents" :key="d.code"
                            class="flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition"
                            :class="docCode === d.code ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'"
                        >
                            <input type="radio" :value="d.code" v-model="docCode" class="mt-0.5 text-blue-600" />
                            <span>
                                <span class="text-sm font-semibold text-slate-700 block">{{ d.name }}</span>
                                <span class="text-xs text-slate-400">{{ d.description }}</span>
                            </span>
                        </label>
                    </div>

                    <div v-if="selectedDoc?.is_controlled" class="border-t pt-3">
                        <span class="text-xs font-semibold text-slate-500">Datos de control del certificado (opcional)</span>
                        <div class="grid grid-cols-3 gap-2 mt-2">
                            <input v-model="control.number" @input="debouncedPreview" placeholder="No. de certificado" class="rounded-lg border-slate-300 text-sm" />
                            <input v-model="control.book" @input="debouncedPreview" placeholder="Libro" class="rounded-lg border-slate-300 text-sm" />
                            <input v-model="control.sheet" @input="debouncedPreview" placeholder="Foja" class="rounded-lg border-slate-300 text-sm" />
                        </div>
                    </div>

                    <p v-if="msg" class="text-sm" :class="msgError ? 'text-red-600' : 'text-emerald-600'">{{ msg }}</p>
                    <div class="flex justify-end">
                        <button
                            @click="emit"
                            :disabled="!docCode || busy"
                            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                        >
                            <svg v-if="busy" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                            Emitir documento
                        </button>
                    </div>
                </div>
            </div>

            <!-- Columna derecha: vista previa -->
            <div class="bg-white border rounded-2xl shadow-sm overflow-hidden lg:sticky lg:top-4">
                <div class="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wide">Vista previa</span>
                    <span v-if="docCode" class="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">BORRADOR — sin folio ni firma</span>
                </div>
                <div class="relative" style="height:70vh">
                    <div v-if="!docCode" class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm gap-2 px-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-9 h-9 opacity-40">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        Elige un documento para ver la vista previa.
                    </div>
                    <div v-else-if="previewLoading" class="absolute inset-0 flex items-center justify-center">
                        <svg class="animate-spin w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    </div>
                    <div v-else-if="previewError" class="absolute inset-0 flex items-center justify-center text-sm text-red-600 px-6 text-center">{{ previewError }}</div>
                    <iframe v-show="docCode && !previewLoading && !previewError && previewUrl" :src="previewUrl ?? undefined" class="w-full h-full border-0" title="Vista previa"></iframe>
                </div>
            </div>
        </div>

        <StudentPickerModal :open="pickerOpen" @close="pickerOpen = false" @select="onPickStudent" />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { DeskDocument, StudentSummary } from '@/modules/service-desk/types/service-desk.type'
import { openDocument } from '@/modules/service-desk/pages/openDocument'
import StudentPickerModal from '@/modules/service-desk/components/StudentPickerModal.vue'
import { useReportGenerator } from '@/modules/reports/composables/useReportGenerator'

const D = API.SERVICE_DESK_API
const { renderPdf } = useReportGenerator()

// Constancias migradas al REPORTEADOR (code de service_desk_document → code del reporte).
// La vista previa/emisión de estas usa plantilla .docx + DAO + LibreOffice (PDF real).
const REPORT_BY_DOC: Record<string, string> = {
    CONSTANCIA_ESTUDIOS: 'RPT.CONSTANCIA_ESTUDIOS',
}

const summary = ref<StudentSummary | null>(null)
const documents = ref<DeskDocument[]>([])
const docCode = ref('')
const control = reactive({ number: '', book: '', sheet: '' })
const busy = ref(false), msg = ref(''), msgError = ref(false)
const pickerOpen = ref(false)

const previewUrl = ref<string | null>(null)
const previewLoading = ref(false)
const previewError = ref('')

const selectedDoc = computed(() => documents.value.find(d => d.code === docCode.value) || null)
const initials = computed(() => {
    const parts = (summary.value?.full_name?.trim() ?? '').split(/\s+/).filter(Boolean)
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '—'
})

function revokePreview() {
    if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = null }
}

async function fetchPreview() {
    if (!summary.value || !docCode.value) { revokePreview(); return }
    previewLoading.value = true
    previewError.value = ''
    try {
        const reportCode = REPORT_BY_DOC[docCode.value]
        if (reportCode) {
            // Reporteador: plantilla + DAO → PDF (borrador sin folio ni firma).
            const { blob } = await renderPdf({
                reportCode,
                params: { student_id: summary.value.student_id, emission_id: null },
            })
            revokePreview()
            previewUrl.value = URL.createObjectURL(blob)
        } else {
            // Documentos aún no migrados al reporteador: preview HTML del renderer.
            const { data } = await api.post(D.preview, {
                student_id: summary.value.student_id,
                document_code: docCode.value,
                control_number: control.number || null,
                control_book: control.book || null,
                control_sheet: control.sheet || null,
            }, { responseType: 'blob' })
            revokePreview()
            previewUrl.value = URL.createObjectURL(new Blob([data], { type: 'text/html' }))
        }
    } catch (e: any) {
        revokePreview()
        previewError.value = e?.response?.data?.message ?? 'No se pudo generar la vista previa.'
    } finally {
        previewLoading.value = false
    }
}

let previewTimer: ReturnType<typeof setTimeout> | null = null
function debouncedPreview() {
    if (previewTimer) clearTimeout(previewTimer)
    previewTimer = setTimeout(fetchPreview, 400)
}

watch(docCode, () => { fetchPreview() })

async function onPickStudent(s: any) {
    pickerOpen.value = false
    msg.value = ''; msgError.value = false
    docCode.value = ''
    revokePreview()
    Object.assign(control, { number: '', book: '', sheet: '' })
    try {
        summary.value = (await api.get(D.studentSummary(s.id))).data
    } catch (e: any) {
        summary.value = null
        msg.value = e?.response?.status === 403
            ? 'Este estudiante no corresponde a tu ventanilla.'
            : (e?.response?.data?.message ?? 'No se pudo cargar el estudiante.')
        msgError.value = true
    }
}

async function emit() {
    if (!summary.value) return
    busy.value = true; msg.value = ''; msgError.value = false
    try {
        const { data } = await api.post(D.emit, {
            student_id: summary.value.student_id, document_code: docCode.value,
            control_number: control.number || null, control_book: control.book || null, control_sheet: control.sheet || null,
        })
        msg.value = `Emitido con folio ${data.folio ?? 's/f'}. Abriendo documento…`
        await openDocument(data.id)
    } catch (e: any) { msg.value = e?.response?.data?.message ?? 'No se pudo emitir.'; msgError.value = true }
    finally { busy.value = false }
}

onMounted(async () => { documents.value = (await api.get(D.documents)).data ?? [] })
onBeforeUnmount(revokePreview)
</script>
