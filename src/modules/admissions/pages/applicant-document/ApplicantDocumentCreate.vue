<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">SUBIR DOCUMENTO</h1>
            <button
                class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                @click="router.push({ name: 'admissions.applicant-documents', params: { applicantId } })"
            >
                VOLVER
            </button>
        </div>

        <!-- Applicant info card -->
        <div v-if="applicant" class="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <p class="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-0.5">ASPIRANTE</p>
            <p class="text-sm font-semibold text-slate-800">{{ applicant.names }} {{ applicant.firstSurname }}</p>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <!-- Tipo de documento -->
                <div class="space-y-1 sm:col-span-2">
                    <label class="text-xs font-medium text-slate-600 uppercase tracking-widest">TIPO DE DOCUMENTO</label>
                    <select
                        v-model="form.document_type_id"
                        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Seleccionar tipo</option>
                        <option v-for="dt in documentTypes" :key="dt.id" :value="dt.id">
                            {{ dt.name }}
                        </option>
                    </select>
                </div>

                <FormInput label="RUTA DEL ARCHIVO" v-model="form.path" uppercase />
                <FormInput label="NOMBRE ORIGINAL" v-model="form.original_name" uppercase />
                <FormInput label="TIPO MIME" v-model="form.mime_type" uppercase />
                <FormInput label="TAMAÑO (KB)" v-model.number="form.size_kb" type="number" />

                <!-- Disco -->
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600 uppercase tracking-widest">DISCO</label>
                    <select
                        v-model="form.disk"
                        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="local">Local</option>
                        <option value="s3">S3</option>
                    </select>
                </div>
            </div>

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-2 pt-4 border-t">
                <button
                    class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50"
                    @click="router.push({ name: 'admissions.applicant-documents', params: { applicantId } })"
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
import FormInput from '@/app/components/ui/form/FormInput.vue'

const route = useRoute()
const router = useRouter()
const applicantId = route.params.applicantId as string

const submitting = ref(false)
const error = ref<string | null>(null)
const applicant = ref<{ names: string; firstSurname: string } | null>(null)
const documentTypes = ref<{ id: number; name: string }[]>([])

const form = ref({
    document_type_id: '' as number | '',
    disk: 'local',
    path: '',
    original_name: '',
    mime_type: '',
    size_kb: '' as number | '',
})

async function loadData() {
    try {
        const [applicantRes, dtRes] = await Promise.all([
            api.get(API.ADMISSIONS_API.applicants.byId(applicantId)),
            api.get(API.ADMISSIONS_API.documentTypes.list),
        ])
        applicant.value = applicantRes.data
        const dtData = dtRes.data?.data ?? dtRes.data
        documentTypes.value = Array.isArray(dtData) ? dtData : []
    } catch {}
}

async function submit() {
    error.value = null
    submitting.value = true
    try {
        const payload = {
            document_type_id: form.value.document_type_id || null,
            disk:             form.value.disk,
            path:             form.value.path,
            original_name:    form.value.original_name,
            mime_type:        form.value.mime_type || null,
            size_kb:          form.value.size_kb !== '' ? form.value.size_kb : null,
            status:           'pending',
        }
        await api.post(API.ADMISSIONS_API.applicantDocuments.create(applicantId), payload)
        router.push({ name: 'admissions.applicant-documents', params: { applicantId } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

onMounted(loadData)
</script>
