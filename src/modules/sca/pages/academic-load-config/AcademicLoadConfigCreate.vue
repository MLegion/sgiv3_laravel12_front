<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Crear Configuración de Carga</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div v-if="submitting" class="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-xl">
                <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span class="text-sm text-slate-500 font-bold uppercase">GUARDANDO...</span>
            </div>

            <div v-if="errors.length" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 space-y-1">
                <p v-for="err in errors" :key="err">{{ err }}</p>
            </div>

            <form class="space-y-5" @submit.prevent="submit">
                <FormRemoteSelect
                    label="PERIODO ACADÉMICO"
                    v-model="form.collegeAcademicPeriodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.byId"
                    :item-label="(cap: any) => cap.academicPeriod?.name || 'Periodo #' + cap.id"
                    item-value="id"
                    required
                />

                <FormRemoteSelect
                    label="MODALIDAD"
                    v-model="form.modalityId"
                    :endpoint="API.SCHOOL_SERVICES_API.modalities.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.modalities.byId"
                    :item-label="(m: any) => m.modalityType?.name || 'Modalidad #' + m.id"
                    item-value="id"
                    required
                />

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">ESTADO INICIAL</label>
                    <select v-model="form.status" class="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-blue-500">
                        <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                </div>

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                    <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" :disabled="submitting">GUARDAR</button>
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
import { STATUS_OPTIONS } from '@/modules/sca/types/academicLoadConfig.type'

const router = useRouter()
const submitting = ref(false)
const errors = ref<string[]>([])

const form = reactive({
    collegeAcademicPeriodId: null as number | null,
    modalityId:              null as number | null,
    status:                  'draft' as string,
})

async function submit() {
    errors.value = []
    submitting.value = true
    try {
        const res = await api.post(API.SCA_API.academicLoadConfigs.create, {
            college_academic_period_id: form.collegeAcademicPeriodId,
            modality_id:                form.modalityId,
            status:                     form.status,
        })
        router.push({ name: 'sca.academic-load-configs.edit', params: { id: res.data.id } })
    } catch (e: any) {
        const data = e?.response?.data
        if (data?.errors) {
            errors.value = Object.values(data.errors).flat() as string[]
        } else if (data?.message) {
            errors.value = [data.message]
        } else {
            errors.value = ['Ocurrió un error al guardar.']
        }
    } finally {
        submitting.value = false
    }
}
</script>
