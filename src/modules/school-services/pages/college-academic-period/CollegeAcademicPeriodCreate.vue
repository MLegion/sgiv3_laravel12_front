<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">ADOPTAR - PERIODO ACADÉMICO</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">

            <FormSelect
                label="PERIODO GLOBAL"
                v-model="form.academicPeriodId"
                :options="periodOptions"
                required
            />

            <div v-if="selectedPeriod" class="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700 space-y-1">
                <p><span class="font-semibold">Inicio sugerido:</span> {{ selectedPeriod.suggestedStartDate }}</p>
                <p><span class="font-semibold">Fin sugerido:</span> {{ selectedPeriod.suggestedEndDate }}</p>
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
                    ADOPTAR PERIODO
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import { STATUS_OPTIONS } from '@/modules/school-services/types/college-academic-period.type'

const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)
const periodOptions = ref<{ label: string; value: any; raw?: any }[]>([])

const form = reactive({
    academicPeriodId: null as number | null,
    actualStartDate: '',
    actualEndDate: '',
    status: 'draft',
    collegeId: null as number | null,
})

const selectedPeriod = computed(() =>
    periodOptions.value.find(p => p.value == form.academicPeriodId)?.raw ?? null
)

async function loadData() {
    const [periodsRes, meRes] = await Promise.all([
        api.get(API.SUPERADMIN_API.academicPeriods.list),
        api.get('/api/v1/auth/me'),
    ])

    form.collegeId = meRes.data?.college?.id ?? meRes.data?.collegeId ?? null

    periodOptions.value = (periodsRes.data.data ?? []).map((p: any) => ({
        label: `${p.name} (${p.shortName})`,
        value: p.id,
        raw: p,
    }))
}

async function submit() {
    error.value = null
    submitting.value = true
    try {
        await api.post(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.create, {
            college_id:          form.collegeId,
            academic_period_id:  form.academicPeriodId,
            actual_start_date:   form.actualStartDate,
            actual_end_date:     form.actualEndDate,
            status:              form.status,
        })
        router.push({ name: 'school-services.college-academic-periods' })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al adoptar el periodo.'
    } finally {
        submitting.value = false
    }
}

onMounted(loadData)
</script>
