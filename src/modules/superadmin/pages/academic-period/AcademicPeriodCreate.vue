<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">REGISTRAR - PERIODO ACADÉMICO</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">
                VOLVER
            </button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <FormInput label="NOMBRE DEL PERIODO" v-model="form.name" uppercase required />
            <FormInput label="CLAVE CORTA" v-model="form.shortName" uppercase required />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">FECHA DE INICIO SUGERIDA</label>
                    <input
                        type="date"
                        v-model="form.suggestedStartDate"
                        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">FECHA DE FIN SUGERIDA</label>
                    <input
                        type="date"
                        v-model="form.suggestedEndDate"
                        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <FormSelect
                label="ESTADO INICIAL"
                v-model="form.status"
                :options="STATUS_OPTIONS"
            />

            <FormSelect
                label="PERIODO ANTERIOR (OPCIONAL)"
                v-model="form.previousPeriodId"
                :options="periodOptions"
            />

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-2 pt-4 border-t">
                <button class="px-4 py-2 text-sm border rounded-lg" @click="router.back()">CANCELAR</button>
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
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import { ACADEMIC_PERIOD_STATUS_OPTIONS as STATUS_OPTIONS } from '@/modules/superadmin/types/academic-period.type'
import type { AcademicPeriod } from '@/modules/superadmin/types/academic-period.type'

const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)
const periodOptions = ref<{ label: string; value: any }[]>([])

const form = reactive({
    name: '',
    shortName: '',
    suggestedStartDate: '',
    suggestedEndDate: '',
    status: 'draft',
    previousPeriodId: null as number | null,
})

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function autoName(start: string, end: string): string {
    const s = new Date(start + 'T12:00:00')
    const e = new Date(end   + 'T12:00:00')
    const ms = MONTHS_ES[s.getMonth()]
    const me = MONTHS_ES[e.getMonth()]
    const ys = s.getFullYear()
    const ye = e.getFullYear()
    return ys === ye
        ? `${ms} - ${me} ${ys}`
        : `${ms} ${ys} - ${me} ${ye}`
}

watch(
    () => [form.suggestedStartDate, form.suggestedEndDate] as const,
    ([start, end]) => {
        if (!form.name && start && end) {
            form.name = autoName(start, end).toUpperCase()
        }
    }
)

async function loadPeriods() {
    const { data } = await api.get(API.SUPERADMIN_API.academicPeriods.list)
    periodOptions.value = (data.data ?? []).map((p: AcademicPeriod) => ({
        label: `${p.name} (${p.shortName})`,
        value: p.id,
    }))
}

async function submit() {
    error.value = null
    submitting.value = true
    try {
        await api.post(API.SUPERADMIN_API.academicPeriods.create, {
            name:                  form.name,
            short_name:            form.shortName,
            suggested_start_date:  form.suggestedStartDate,
            suggested_end_date:    form.suggestedEndDate,
            status:                form.status,
            previous_period_id:    form.previousPeriodId || null,
        })
        router.push({ name: 'superadmin.academic-periods' })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar el periodo.'
    } finally {
        submitting.value = false
    }
}

onMounted(loadPeriods)
</script>
