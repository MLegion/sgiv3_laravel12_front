<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Editar Modalidad</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div v-if="loading || submitting" class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-xl">
                <span class="text-sm text-slate-500 font-bold uppercase tracking-widest">
                    {{ loading ? 'CARGANDO...' : 'GUARDANDO...' }}
                </span>
            </div>

            <form v-if="!loading" class="space-y-6" @submit.prevent="submit">
                <FormRemoteSelect
                    label="CAMPUS"
                    v-model="form.campusId"
                    :endpoint="API.SCHOOL_SERVICES_API.campuses.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.campuses.byId"
                    item-label="name"
                    item-value="id"
                    required
                />

                <FormRemoteSelect
                    label="TIPO DE MODALIDAD"
                    v-model="form.modalityTypeId"
                    :endpoint="API.SUPERADMIN_API.modalityTypes.list"
                    :endpoint-by-id="API.SUPERADMIN_API.modalityTypes.byId"
                    item-label="name"
                    item-value="id"
                    required
                />

                <FormSwitch label="ACTIVO" v-model="form.status" />

                <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                    <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" :disabled="submitting">ACTUALIZAR</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)

const form = reactive({
    campusId:       null as number | null,
    modalityTypeId: null as number | null,
    status:         true,
})

async function fetchModality() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.byId(route.params.id as string))
        form.campusId       = data.campusId
        form.modalityTypeId = data.modalityTypeId
        form.status         = data.status
    } finally {
        loading.value = false
    }
}

async function submit() {
    error.value = null
    submitting.value = true
    try {
        await api.put(API.SCHOOL_SERVICES_API.modalities.update(route.params.id as string), {
            campus_id:        form.campusId,
            modality_type_id: form.modalityTypeId,
            status:           form.status,
        })
        router.push({ name: 'school-services.modalities.show', params: { id: route.params.id } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al actualizar.'
    } finally {
        submitting.value = false
    }
}

onMounted(fetchModality)
</script>
