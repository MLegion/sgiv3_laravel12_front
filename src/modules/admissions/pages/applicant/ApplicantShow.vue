<template>
    <div class="max-w-3xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">DETALLE - ASPIRANTE</h1>
            <div class="flex gap-2">
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
                <button
                    class="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    :disabled="loading"
                    @click="router.push({ name: 'admissions.applicants.edit', params: { id: route.params.id } })"
                >
                    EDITAR
                </button>
            </div>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-8">
            <!-- Encabezado con foto -->
            <section class="flex items-start gap-6">
                <!-- Foto -->
                <div class="shrink-0">
                    <div class="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 border flex items-center justify-center">
                        <img
                            v-if="applicant.photoPath"
                            :src="API.ADMISSIONS_API.applicants.photo(route.params.id as string)"
                            class="w-full h-full object-cover"
                            alt="Foto del aspirante"
                        />
                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </div>
                </div>

                <!-- Nombre y estado -->
                <div class="flex-1 space-y-1">
                    <template v-if="loading">
                        <Skeleton width="w-1/2" height="h-6" />
                        <Skeleton width="w-32" height="h-4" />
                    </template>
                    <template v-else>
                        <h2 class="text-lg font-semibold text-slate-800 uppercase">
                            {{ applicant.names }} {{ applicant.firstSurname }} {{ applicant.secondSurname }}
                        </h2>
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-mono text-slate-400">ID: #{{ applicant.id }}</span>
                            <span
                                class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                :class="STATUS_CLASSES[applicant.status] ?? 'bg-slate-100 text-slate-500'"
                            >
                                {{ STATUS_OPTIONS.find(o => o.value === applicant.status)?.label ?? applicant.status }}
                            </span>
                            <span v-if="applicant.applicationFolio" class="text-xs font-mono text-slate-400">
                                FOLIO: {{ applicant.applicationFolio }}
                            </span>
                        </div>
                    </template>
                </div>
            </section>

            <!-- Datos personales -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">DATOS PERSONALES</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="EMAIL"    :value="applicant.email"  :loading="loading" />
                    <InfoItem label="TELÉFONO" :value="applicant.phone"  :loading="loading" />
                    <InfoItem label="CURP"     :value="applicant.curp"   :loading="loading" />
                </div>
            </section>

            <!-- Inscripción -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">INSCRIPCIÓN</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="OFERTA ACADÉMICA"  :value="applicant.academicOffer?.career?.name ?? '—'" :loading="loading" />
                    <InfoItem label="PERIODO"           :value="applicant.academicPeriod?.name ?? '—'"        :loading="loading" />
                    <InfoItem label="ESCUELA DE ORIGEN" :value="applicant.originSchool"                       :loading="loading" />
                    <InfoItem label="PUNTAJE DE INGRESO" :value="applicant.entranceScore"                     :loading="loading" />
                </div>
            </section>

            <!-- Documentos -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">DOCUMENTOS</h3>

                <div v-if="loadingDocs" class="text-xs text-slate-400">Cargando documentos...</div>

                <div v-else-if="documents.length === 0" class="text-xs text-slate-400 italic">
                    Sin documentos subidos.
                </div>

                <ul v-else class="divide-y rounded-xl border overflow-hidden">
                    <li
                        v-for="doc in documents"
                        :key="doc.id"
                        class="flex items-center justify-between px-4 py-3 text-sm bg-white hover:bg-slate-50"
                    >
                        <div class="space-y-0.5">
                            <p class="font-medium text-slate-700">{{ doc.documentType?.name ?? `Tipo #${doc.documentTypeId}` }}</p>
                            <p class="text-xs text-slate-400">{{ doc.originalName }} · {{ formatSize(doc.sizeKb) }}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="DOC_STATUS_CLASSES[doc.status]">
                                {{ DOC_STATUS_OPTIONS.find(o => o.value === doc.status)?.label ?? doc.status }}
                            </span>
                            <a
                                :href="API.ADMISSIONS_API.applicants.downloadDocument(route.params.id as string, doc.id)"
                                target="_blank"
                                class="p-1.5 rounded border text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                title="Ver archivo"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                            </a>
                        </div>
                    </li>
                </ul>
            </section>

            <!-- Metadatos -->
            <section class="pt-4 border-t">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="CREADO"      :value="formatDate(applicant.createdAt)" :loading="loading" />
                    <InfoItem label="ACTUALIZADO" :value="formatDate(applicant.updatedAt)" :loading="loading" />
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
import type { Applicant } from '@/modules/admissions/types/applicant.type'
import { STATUS_OPTIONS, STATUS_CLASSES } from '@/modules/admissions/types/applicant.type'
import type { ApplicantDocument } from '@/modules/admissions/types/applicant-document.type'
import { DOC_STATUS_OPTIONS, DOC_STATUS_CLASSES } from '@/modules/admissions/types/applicant-document.type'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const loadingDocs = ref(true)
const applicant = ref<Applicant>({} as Applicant)
const documents = ref<ApplicantDocument[]>([])

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.applicants.byId(route.params.id as string))
        applicant.value = data
    } finally {
        setTimeout(() => { loading.value = false }, 300)
    }
}

async function fetchDocuments() {
    loadingDocs.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.applicants.documents(route.params.id as string))
        documents.value = data.data ?? data
    } finally {
        loadingDocs.value = false
    }
}

function formatDate(value?: string | null) {
    if (!value) return null
    try {
        return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
    } catch { return value }
}

function formatSize(kb?: number | null) {
    if (!kb) return ''
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

onMounted(() => {
    fetchData()
    fetchDocuments()
})
</script>
