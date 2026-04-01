<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">MI EXPEDIENTE</h1>
        </div>

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>

        <template v-else-if="applicant">
            <!-- Datos personales -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-3">
                <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">DATOS PERSONALES</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-xs text-slate-400">NOMBRE</p>
                        <p class="font-medium text-slate-700">{{ applicant.names }} {{ applicant.firstSurname }} {{ applicant.secondSurname }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-slate-400">EMAIL</p>
                        <p class="font-medium text-slate-700">{{ applicant.email }}</p>
                    </div>
                    <div v-if="applicant.curp">
                        <p class="text-xs text-slate-400">CURP</p>
                        <p class="font-medium text-slate-700">{{ applicant.curp }}</p>
                    </div>
                    <div v-if="applicant.phone">
                        <p class="text-xs text-slate-400">TELÉFONO</p>
                        <p class="font-medium text-slate-700">{{ applicant.phone }}</p>
                    </div>
                    <div v-if="applicant.college">
                        <p class="text-xs text-slate-400">INSTITUCIÓN</p>
                        <p class="font-medium text-slate-700">{{ applicant.college.name }}</p>
                    </div>
                    <div v-if="applicant.academicPeriod">
                        <p class="text-xs text-slate-400">PERÍODO DE ADMISIÓN</p>
                        <p class="font-medium text-slate-700">{{ applicant.academicPeriod.name }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-slate-400">ESTADO</p>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="statusClass(applicant.status)">
                            {{ statusLabel(applicant.status) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Documentos -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">MIS DOCUMENTOS</h3>

                <div v-if="loadingDocs" class="text-xs text-slate-400">Cargando documentos...</div>

                <div v-else-if="docSlots.length === 0" class="text-xs text-slate-400 italic">
                    No hay documentos requeridos configurados.
                </div>

                <ul v-else class="space-y-2">
                    <li
                        v-for="slot in docSlots"
                        :key="slot.documentTypeId"
                        class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                        :class="slot.uploaded ? 'bg-slate-50' : 'bg-white'"
                    >
                        <div class="space-y-0.5">
                            <div class="flex items-center gap-2">
                                <p class="font-medium text-slate-700">{{ slot.name }}</p>
                                <span v-if="slot.isRequired" class="text-[10px] font-bold text-red-500">OBLIGATORIO</span>
                            </div>
                            <p v-if="slot.doc" class="text-xs text-slate-400">
                                {{ slot.doc.originalName }} · {{ formatSize(slot.doc.sizeKb) }}
                            </p>
                            <p v-else class="text-xs text-slate-400 italic">Sin subir</p>
                        </div>

                        <div class="flex items-center gap-2">
                            <span
                                v-if="slot.doc"
                                class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                :class="DOC_STATUS_CLASSES[slot.doc.status]"
                            >
                                {{ DOC_STATUS_OPTIONS.find(o => o.value === slot.doc!.status)?.label }}
                            </span>

                            <label
                                v-if="!slot.doc || slot.doc.status !== 'approved'"
                                class="flex items-center gap-1 px-2 py-1.5 text-xs border rounded-lg cursor-pointer hover:bg-slate-100"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                                {{ slot.doc ? 'REEMPLAZAR' : 'SUBIR' }}
                                <input
                                    type="file"
                                    class="hidden"
                                    :accept="slot.acceptsFormats ? slot.acceptsFormats.map((f: string) => `.${f.replace(/^\./, '')}`).join(',') : ''"
                                    @change="(e) => uploadDocument(e, slot.documentTypeId)"
                                />
                            </label>
                        </div>
                    </li>
                </ul>

                <p v-if="docError" class="text-xs text-red-600">{{ docError }}</p>
                <p v-if="docSuccess" class="text-xs text-green-600">{{ docSuccess }}</p>
            </div>
        </template>

        <div v-else class="text-sm text-slate-400 py-8 text-center">
            No se encontró un expediente de aspirante vinculado a tu cuenta.
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ApplicantDocument } from '@/modules/admissions/types/applicant-document.type'
import { DOC_STATUS_OPTIONS, DOC_STATUS_CLASSES } from '@/modules/admissions/types/applicant-document.type'

const loading    = ref(true)
const loadingDocs = ref(true)
const applicant  = ref<any>(null)
const docSlots   = ref<DocSlot[]>([])
const docError   = ref<string | null>(null)
const docSuccess = ref<string | null>(null)

interface DocSlot {
    documentTypeId: number
    name: string
    isRequired: boolean
    acceptsFormats: string[] | null
    uploaded: boolean
    doc: ApplicantDocument | null
}

const STATUS_MAP: Record<number, { label: string; cls: string }> = {
    1: { label: 'PROSPECTO',  cls: 'bg-slate-100 text-slate-600' },
    2: { label: 'ASPIRANTE',  cls: 'bg-blue-100 text-blue-700' },
    3: { label: 'ADMITIDO',   cls: 'bg-green-100 text-green-700' },
    4: { label: 'INSCRITO',   cls: 'bg-emerald-100 text-emerald-700' },
    0: { label: 'CANCELADO',  cls: 'bg-red-100 text-red-700' },
}

function statusLabel(s: number) { return STATUS_MAP[s]?.label ?? `${s}` }
function statusClass(s: number) { return STATUS_MAP[s]?.cls ?? '' }

async function fetchMe() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.portal.me)
        applicant.value = data
    } catch {
        applicant.value = null
    } finally {
        loading.value = false
    }
}

async function fetchDocuments() {
    loadingDocs.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.portal.documents)
        const required: any[] = data.required ?? []
        const uploaded: ApplicantDocument[] = data.uploaded ?? []

        docSlots.value = required.map(r => ({
            documentTypeId: r.documentTypeId,
            name:           r.name,
            isRequired:     r.isRequired,
            acceptsFormats: r.acceptsFormats ?? null,
            uploaded:       r.uploaded,
            doc:            uploaded.find(d => d.documentTypeId === r.documentTypeId) ?? null,
        }))

        // Documentos subidos que no estén en los requeridos
        uploaded.forEach(d => {
            if (!docSlots.value.some(s => s.documentTypeId === d.documentTypeId)) {
                docSlots.value.push({
                    documentTypeId: d.documentTypeId,
                    name:           d.documentType?.name ?? `Tipo #${d.documentTypeId}`,
                    isRequired:     false,
                    acceptsFormats: null,
                    uploaded:       true,
                    doc:            d,
                })
            }
        })
    } finally {
        loadingDocs.value = false
    }
}

async function uploadDocument(event: Event, documentTypeId: number) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    docError.value = null
    docSuccess.value = null
    try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('document_type_id', String(documentTypeId))
        await api.post(API.ADMISSIONS_API.portal.upload, fd)
        await fetchDocuments()
        docSuccess.value = 'Documento subido correctamente.'
    } catch (e: any) {
        docError.value = e?.response?.data?.message ?? 'Error al subir el documento.'
    }
}

function formatSize(kb?: number | null) {
    if (!kb) return ''
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

onMounted(async () => {
    await fetchMe()
    if (applicant.value) fetchDocuments()
    else loadingDocs.value = false
})
</script>
