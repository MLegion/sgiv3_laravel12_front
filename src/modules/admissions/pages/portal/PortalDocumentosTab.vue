<template>
    <div class="p-6 space-y-4">
        <div v-if="loading" class="text-xs text-slate-400">Cargando documentos...</div>

        <div v-else-if="slots.length === 0" class="text-xs text-slate-400 italic">
            No hay documentos requeridos configurados.
        </div>

        <ul v-else class="space-y-2">
            <li
                v-for="slot in slots"
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
                            @change="(e) => uploadDoc(e, slot.documentTypeId)"
                        />
                    </label>
                </div>
            </li>
        </ul>

        <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
        <p v-if="success" class="text-xs text-green-600">{{ success }}</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ApplicantDocument } from '@/modules/admissions/types/applicant-document.type'
import { DOC_STATUS_OPTIONS, DOC_STATUS_CLASSES } from '@/modules/admissions/types/applicant-document.type'

interface DocSlot {
    documentTypeId: number
    name: string
    isRequired: boolean
    acceptsFormats: string[] | null
    uploaded: boolean
    doc: ApplicantDocument | null
}

const loading = ref(false)
const slots   = ref<DocSlot[]>([])
const error   = ref<string | null>(null)
const success = ref<string | null>(null)

async function fetchDocs() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.portal.documents)
        const required: any[] = data.required ?? []
        const uploaded: ApplicantDocument[] = data.uploaded ?? []

        slots.value = required.map(r => ({
            documentTypeId: r.documentTypeId,
            name:           r.name,
            isRequired:     r.isRequired,
            acceptsFormats: r.acceptsFormats ?? null,
            uploaded:       r.uploaded,
            doc:            uploaded.find(d => d.documentTypeId === r.documentTypeId) ?? null,
        }))

        uploaded.forEach(d => {
            if (!slots.value.some(s => s.documentTypeId === d.documentTypeId)) {
                slots.value.push({
                    documentTypeId: d.documentTypeId,
                    name:           d.documentType?.name ?? `Tipo #${d.documentTypeId}`,
                    isRequired:     false,
                    acceptsFormats: null,
                    uploaded:       true,
                    doc:            d,
                })
            }
        })
    } finally { loading.value = false }
}

async function uploadDoc(event: Event, documentTypeId: number) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    error.value   = null
    success.value = null
    try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('document_type_id', String(documentTypeId))
        await api.post(API.ADMISSIONS_API.portal.upload, fd)
        await fetchDocs()
        success.value = 'Documento subido correctamente.'
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al subir el documento.'
    }
}

function formatSize(kb?: number | null) {
    if (!kb) return ''
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

onMounted(fetchDocs)
</script>
