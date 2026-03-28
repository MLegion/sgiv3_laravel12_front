<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">DETALLE - DOCUMENTO</h1>
            <div class="flex gap-2">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                    @click="router.push({ name: 'admissions.applicant-documents', params: { applicantId } })"
                >
                    VOLVER
                </button>
                <button
                    class="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    :disabled="loading"
                    @click="router.push({ name: 'admissions.applicant-documents.review', params: { applicantId, id: route.params.id } })"
                >
                    REVISAR
                </button>
            </div>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-8">
            <!-- ARCHIVO -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">ARCHIVO</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <template v-if="loading">
                        <Skeleton v-for="i in 6" :key="i" width="w-full" height="h-10" />
                    </template>
                    <template v-else>
                        <InfoItem label="TIPO DE DOCUMENTO" :value="doc.documentType?.name ?? `Tipo #${doc.documentTypeId}`" />
                        <InfoItem label="NOMBRE ORIGINAL"   :value="doc.originalName" />
                        <InfoItem label="RUTA"              :value="doc.path" />
                        <InfoItem label="TIPO MIME"         :value="doc.mimeType" />
                        <InfoItem label="TAMAÑO"            :value="formatSize(doc.sizeKb)" />
                        <InfoItem label="DISCO"             :value="doc.disk" />
                    </template>
                </div>
            </section>

            <!-- REVISIÓN -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">REVISIÓN</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <template v-if="loading">
                        <Skeleton v-for="i in 3" :key="i" width="w-full" height="h-10" />
                    </template>
                    <template v-else>
                        <div class="space-y-1">
                            <p class="text-xs font-medium text-slate-500 uppercase tracking-widest">ESTADO</p>
                            <span
                                class="inline-block px-2 py-1 text-xs font-semibold rounded-full"
                                :class="DOC_STATUS_CLASSES[doc.status] ?? 'bg-slate-100 text-slate-500'"
                            >
                                {{ DOC_STATUS_OPTIONS.find(o => o.value === doc.status)?.label ?? doc.status }}
                            </span>
                        </div>
                        <InfoItem label="MOTIVO DE RECHAZO" :value="doc.rejectionReason" />
                        <InfoItem label="FECHA DE REVISIÓN"  :value="formatDate(doc.reviewedAt)" />
                    </template>
                </div>
            </section>

            <!-- Metadatos -->
            <section class="pt-4 border-t">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="CREADO"      :value="formatDate(doc.createdAt)" :loading="loading" />
                    <InfoItem label="ACTUALIZADO" :value="formatDate(doc.updatedAt)" :loading="loading" />
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import InfoItem from '@/app/components/ui/InfoItem.vue'
import Skeleton from '@/app/components/ui/Skeleton.vue'
import type { ApplicantDocument } from '@/modules/admissions/types/applicant-document.type'
import { DOC_STATUS_OPTIONS, DOC_STATUS_CLASSES } from '@/modules/admissions/types/applicant-document.type'

const route = useRoute()
const router = useRouter()
const applicantId = route.params.applicantId as string
const loading = ref(true)
const doc = ref<ApplicantDocument>({} as ApplicantDocument)

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.ADMISSIONS_API.applicants.documentById(applicantId, route.params.id as string)
        )
        doc.value = data
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
        return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
    } catch { return value }
}

onMounted(fetchData)
</script>
