<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Registrar Modalidad</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div v-if="submitting" class="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-xl">
                <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span class="text-sm text-slate-500 font-bold uppercase">GUARDANDO...</span>
            </div>

            <form class="space-y-6" @submit.prevent="submit">
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
                    <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" :disabled="submitting">GUARDAR</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'

const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)

const form = reactive({
    campusId:       null as number | null,
    modalityTypeId: null as number | null,
    status:         true,
})

async function submit() {
    error.value = null
    submitting.value = true
    try {
        const { data } = await api.post(API.SCHOOL_SERVICES_API.modalities.create, {
            campus_id:        form.campusId,
            modality_type_id: form.modalityTypeId,
            status:           form.status,
        })
        router.push({ name: 'school-services.modalities.show', params: { id: data.id } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}
</script>
