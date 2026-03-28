<template>
    <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                    @click="router.push({ name: 'admissions.applicants.show', params: { id: applicantId } })"
                >
                    VOLVER
                </button>
                <div>
                    <h1 class="text-xl font-semibold text-slate-800 uppercase">Documentos del Aspirante</h1>
                    <p v-if="applicant" class="text-sm text-slate-500 mt-0.5">
                        {{ applicant.names }} {{ applicant.firstSurname }}
                    </p>
                </div>
            </div>
            <button
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="router.push({ name: 'admissions.applicant-documents.create', params: { applicantId } })"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                AGREGAR DOCUMENTO
            </button>
        </div>

        <!-- Table -->
        <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div v-if="loading" class="py-10 text-center text-sm text-slate-400">Cargando documentos...</div>

            <div v-else-if="documents.length === 0" class="py-10 text-center text-sm text-slate-400 italic">
                Sin documentos registrados para este aspirante.
            </div>

            <table v-else class="w-full text-sm">
                <thead class="bg-slate-50 border-b">
                    <tr>
                        <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">TIPO DE DOCUMENTO</th>
                        <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ARCHIVO</th>
                        <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">TAMAÑO</th>
                        <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ESTADO</th>
                        <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">FECHA</th>
                        <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">OPCIONES</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="doc in documents" :key="doc.id" class="hover:bg-slate-50 transition">
                        <td class="px-4 py-3 text-slate-700 font-medium">
                            {{ doc.documentType?.name ?? `Tipo #${doc.documentTypeId}` }}
                        </td>
                        <td class="px-4 py-3 text-slate-600 max-w-xs truncate" :title="doc.originalName">
                            {{ doc.originalName }}
                        </td>
                        <td class="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {{ formatSize(doc.sizeKb) }}
                        </td>
                        <td class="px-4 py-3">
                            <span
                                class="px-2 py-1 text-xs font-semibold rounded-full"
                                :class="DOC_STATUS_CLASSES[doc.status] ?? 'bg-slate-100 text-slate-500'"
                            >
                                {{ DOC_STATUS_OPTIONS.find(o => o.value === doc.status)?.label ?? doc.status }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                            {{ formatDate(doc.createdAt) }}
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center justify-center gap-2">
                                <!-- Ver -->
                                <button
                                    type="button"
                                    class="border p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                                    title="Ver"
                                    @click="router.push({ name: 'admissions.applicant-documents.show', params: { applicantId, id: doc.id } })"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12s-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                                <!-- Revisar -->
                                <button
                                    type="button"
                                    class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                                    title="Revisar"
                                    @click="router.push({ name: 'admissions.applicant-documents.review', params: { applicantId, id: doc.id } })"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                                <!-- Eliminar -->
                                <button
                                    type="button"
                                    class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                                    title="Eliminar"
                                    @click="router.push({ name: 'admissions.applicant-documents.delete', params: { applicantId, id: doc.id } })"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" />
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ApplicantDocument } from '@/modules/admissions/types/applicant-document.type'
import { DOC_STATUS_OPTIONS, DOC_STATUS_CLASSES } from '@/modules/admissions/types/applicant-document.type'

const route = useRoute()
const router = useRouter()

const applicantId = route.params.applicantId as string
const loading = ref(true)
const documents = ref<ApplicantDocument[]>([])
const applicant = ref<{ names: string; firstSurname: string } | null>(null)

async function fetchApplicant() {
    try {
        const { data } = await api.get(API.ADMISSIONS_API.applicants.byId(applicantId))
        applicant.value = data
    } catch {}
}

async function fetchDocuments() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.applicants.documents(applicantId))
        documents.value = Array.isArray(data) ? data : (data.data ?? [])
    } finally {
        setTimeout(() => { loading.value = false }, 300)
    }
}

function formatSize(sizeKb: number | null): string {
    if (sizeKb === null || sizeKb === undefined) return '—'
    if (sizeKb >= 1024) return `${(sizeKb / 1024).toFixed(1)} MB`
    return `${sizeKb} KB`
}

function formatDate(value?: string | null): string {
    if (!value) return '—'
    try {
        return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
    } catch { return value }
}

onMounted(() => {
    fetchApplicant()
    fetchDocuments()
})
</script>
