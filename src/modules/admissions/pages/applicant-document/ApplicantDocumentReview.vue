<template>
    <div class="max-w-lg space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">REVISAR DOCUMENTO</h1>
            <button
                class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                @click="router.push({ name: 'admissions.applicant-documents.show', params: { applicantId, id: route.params.id } })"
            >
                VOLVER
            </button>
        </div>

        <!-- Document info card -->
        <div v-if="!loading" class="bg-slate-50 border rounded-xl px-5 py-4 space-y-1">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest">DOCUMENTO</p>
            <p class="text-sm font-semibold text-slate-800">{{ doc.documentType?.name ?? `Tipo #${doc.documentTypeId}` }}</p>
            <p class="text-xs text-slate-500">{{ doc.originalName }}</p>
        </div>

        <div v-if="loadingData" class="py-8 text-center text-sm text-slate-400">Cargando...</div>

        <div v-else class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <!-- Estado -->
            <div class="space-y-1">
                <label class="text-xs font-medium text-slate-600 uppercase tracking-widest">ESTADO</label>
                <select
                    v-model="form.status"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option v-for="opt in DOC_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>
            </div>

            <!-- Motivo de rechazo (solo si status = rejected) -->
            <div v-if="form.status === 'rejected'" class="space-y-1">
                <label class="text-xs font-medium text-slate-600 uppercase tracking-widest">MOTIVO DE RECHAZO</label>
                <textarea
                    v-model="form.rejection_reason"
                    rows="3"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Indica el motivo del rechazo..."
                />
            </div>

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-2 pt-4 border-t">
                <button
                    class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50"
                    @click="router.push({ name: 'admissions.applicant-documents.show', params: { applicantId, id: route.params.id } })"
                >
                    CANCELAR
                </button>
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="submitting"
                    @click="submit"
                >
                    GUARDAR
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ApplicantDocument } from '@/modules/admissions/types/applicant-document.type'
import { DOC_STATUS_OPTIONS } from '@/modules/admissions/types/applicant-document.type'

const route = useRoute()
const router = useRouter()
const applicantId = route.params.applicantId as string
const loadingData = ref(true)
const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const doc = ref<ApplicantDocument>({} as ApplicantDocument)

const form = ref({
    status: 'pending' as string,
    rejection_reason: '',
})

async function fetchData() {
    loadingData.value = true
    loading.value = true
    try {
        const { data } = await api.get(
            API.ADMISSIONS_API.applicants.documentById(applicantId, route.params.id as string)
        )
        doc.value = data
        form.value.status = data.status ?? 'pending'
        form.value.rejection_reason = data.rejectionReason ?? ''
    } finally {
        loadingData.value = false
        loading.value = false
    }
}

async function submit() {
    error.value = null
    submitting.value = true
    try {
        const payload: Record<string, any> = {
            document_type_id: doc.value.documentTypeId,
            disk:             doc.value.disk,
            path:             doc.value.path,
            original_name:    doc.value.originalName,
            status:           form.value.status,
            rejection_reason: form.value.status === 'rejected' ? (form.value.rejection_reason || null) : null,
        }
        await api.put(
            API.ADMISSIONS_API.applicants.documentById(applicantId, route.params.id as string),
            payload
        )
        router.push({ name: 'admissions.applicant-documents.show', params: { applicantId, id: route.params.id } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

onMounted(fetchData)
</script>
