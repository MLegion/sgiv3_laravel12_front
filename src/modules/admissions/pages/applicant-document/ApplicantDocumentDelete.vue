<template>
    <div class="max-w-md space-y-6">
        <h1 class="text-xl font-semibold text-slate-800">ELIMINAR - DOCUMENTO</h1>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <p class="text-sm text-slate-600">
                ¿ESTÁS SEGURO DE ELIMINAR EL DOCUMENTO
                <strong>{{ docName }}</strong>?
            </p>
            <p class="text-xs text-red-600">ESTA ACCIÓN NO SE PUEDE DESHACER.</p>

            <div class="flex justify-end gap-2 pt-2">
                <button
                    class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50"
                    @click="router.push({ name: 'admissions.applicant-documents', params: { applicantId } })"
                >
                    CANCELAR
                </button>
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    :disabled="loading"
                    @click="remove"
                >
                    ELIMINAR
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

const route = useRoute()
const router = useRouter()
const applicantId = route.params.applicantId as string
const loading = ref(false)
const docName = ref('')

async function fetchName() {
    try {
        const { data } = await api.get(
            API.ADMISSIONS_API.applicants.documentById(applicantId, route.params.id as string)
        )
        const typeName = data.documentType?.name ?? `Tipo #${data.documentTypeId}`
        docName.value = `${typeName} — ${data.originalName}`
    } catch {
        docName.value = `Documento #${route.params.id}`
    }
}

async function remove() {
    loading.value = true
    try {
        await api.delete(
            API.ADMISSIONS_API.applicants.documentById(applicantId, route.params.id as string)
        )
        router.push({ name: 'admissions.applicant-documents', params: { applicantId } })
    } finally {
        loading.value = false
    }
}

onMounted(fetchName)
</script>
