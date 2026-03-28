<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">AJUSTAR - PERIODO INSTITUCIONAL</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">

            <!-- Info del periodo global (solo lectura) -->
            <div v-if="globalPeriod" class="rounded-lg bg-slate-50 border p-4 space-y-1">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Periodo Global</p>
                <p class="text-sm font-semibold text-slate-700">{{ globalPeriod.name }} <span class="text-slate-400">({{ globalPeriod.shortName }})</span></p>
                <p class="text-xs text-slate-500">Sugerido: {{ globalPeriod.suggestedStartDate }} — {{ globalPeriod.suggestedEndDate }}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">FECHA DE INICIO REAL <span class="text-red-500">*</span></label>
                    <input
                        type="date"
                        v-model="form.actualStartDate"
                        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">FECHA DE FIN REAL <span class="text-red-500">*</span></label>
                    <input
                        type="date"
                        v-model="form.actualEndDate"
                        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <FormSelect
                label="ESTADO"
                v-model="form.status"
                :options="STATUS_OPTIONS"
            />

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-2 pt-4 border-t">
                <button class="px-4 py-2 text-sm border rounded-lg" @click="router.back()">CANCELAR</button>
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="submitting"
                    @click="submit"
                >
                    ACTUALIZAR
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import { STATUS_OPTIONS } from '@/modules/school-services/types/college-academic-period.type'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)
const globalPeriod = ref<any>(null)

const form = reactive({
    collegeId: 0,
    academicPeriodId: 0,
    actualStartDate: '',
    actualEndDate: '',
    status: 'draft',
})

async function fetchData() {
    const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.byId(route.params.id))
    form.collegeId        = data.collegeId
    form.academicPeriodId = data.academicPeriodId
    form.actualStartDate  = data.actualStartDate
    form.actualEndDate    = data.actualEndDate
    form.status           = data.status
    globalPeriod.value    = data.academicPeriod ?? null
}

async function submit() {
    error.value = null
    submitting.value = true
    try {
        await api.put(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.update(route.params.id), {
            college_id:         form.collegeId,
            academic_period_id: form.academicPeriodId,
            actual_start_date:  form.actualStartDate,
            actual_end_date:    form.actualEndDate,
            status:             form.status,
        })
        router.push({ name: 'school-services.college-academic-periods.show', params: { id: route.params.id } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al actualizar el periodo.'
    } finally {
        submitting.value = false
    }
}

onMounted(fetchData)
</script>
