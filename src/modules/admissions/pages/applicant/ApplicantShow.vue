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
                    <ApplicantAvatar
                        :applicant-id="applicant.id ?? null"
                        :name="`${applicant.names ?? ''} ${applicant.firstSurname ?? ''}`"
                        size="lg"
                    />
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
                        <div class="flex items-center gap-3 flex-wrap">
                            <span class="text-xs font-mono text-slate-400">ID: #{{ applicant.id }}</span>
                            <span v-if="applicant.college" class="text-xs text-slate-500 font-medium">
                                {{ applicant.college.name }}
                            </span>
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
                    <InfoItem label="INSTITUCIÓN"        :value="applicant.college?.name ?? '—'"              :loading="loading" />
                    <InfoItem label="PERIODO"            :value="applicant.academicPeriod?.name ?? '—'"       :loading="loading" />
                    <InfoItem label="1ª OPCIÓN"          :value="applicant.offerOption1?.career?.name ?? '—'" :loading="loading" />
                    <InfoItem label="2ª OPCIÓN"          :value="applicant.offerOption2?.career?.name ?? '—'" :loading="loading" />
                    <InfoItem label="3ª OPCIÓN"          :value="applicant.offerOption3?.career?.name ?? '—'" :loading="loading" />
                    <InfoItem label="ESCUELA DE ORIGEN"  :value="applicant.originSchool?.name ?? '—'"         :loading="loading" />
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
                                :href="API.ADMISSIONS_API.applicantDocuments.download(route.params.id as string, doc.id)"
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

            <!-- Usuario vinculado -->
            <section class="pt-4 border-t">
                <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">CUENTA DE ACCESO</h3>
                <div v-if="applicant.userId" class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 text-sm">
                        <span class="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                        <div>
                            <p class="text-slate-700 font-medium">{{ applicant.email }}</p>
                            <p class="text-xs text-slate-400">Usuario #{{ applicant.userId }} · El aspirante inicia sesión con este email</p>
                        </div>
                    </div>
                    <button
                        class="px-3 py-1.5 text-xs rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                        :disabled="resetting"
                        @click="resetPassword"
                    >
                        {{ resetting ? 'RESTABLECIENDO...' : 'RESTABLECER CONTRASEÑA' }}
                    </button>
                </div>
                <div v-else class="text-sm text-slate-400 italic">Sin cuenta de usuario vinculada.</div>
            </section>

            <!-- Modal credenciales tras reset -->
            <Teleport to="body">
                <div v-if="resetCredentials" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
                        <h2 class="text-base font-semibold text-slate-800">CONTRASEÑA RESTABLECIDA</h2>
                        <p class="text-sm text-slate-500">Comparte estas credenciales con el aspirante:</p>
                        <div class="bg-slate-50 border rounded-lg p-4 space-y-2 text-sm font-mono">
                            <p><span class="text-slate-400 font-sans">Usuario:</span> {{ resetCredentials.email }}</p>
                            <p><span class="text-slate-400 font-sans">Contraseña:</span> {{ resetCredentials.password }}</p>
                        </div>
                        <p class="text-xs text-slate-400">El aspirante deberá cambiar su contraseña al iniciar sesión.</p>
                        <button
                            class="w-full px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            @click="resetCredentials = null"
                        >
                            CERRAR
                        </button>
                    </div>
                </div>
            </Teleport>

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
import ApplicantAvatar from '@/app/components/ui/ApplicantAvatar.vue'
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
const resetting = ref(false)
const resetCredentials = ref<{ email: string; password: string } | null>(null)

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
        const { data } = await api.get(API.ADMISSIONS_API.applicantDocuments.list(route.params.id as string))
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

async function resetPassword() {
    resetting.value = true
    try {
        const { data } = await api.post(API.ADMISSIONS_API.applicants.resetPassword(route.params.id as string))
        resetCredentials.value = { email: data.email, password: data.password }
    } catch (e: any) {
        alert(e?.response?.data?.message ?? 'Error al restablecer la contraseña.')
    } finally {
        resetting.value = false
    }
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
