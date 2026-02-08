<template>
    <div class="max-w-4xl space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                ACTUALIZAR - PLAN DE ESTUDIO
            </h1>

            <button
                class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                @click="goBack"
            >
                REGRESAR
            </button>
        </div>

        <!-- Card -->
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <!-- Loading overlay -->
            <div
                v-if="loading"
                class="absolute inset-0 bg-white/70 z-10
                       flex items-center justify-center"
            >
                <span class="text-sm text-slate-500">
                    Cargando información…
                </span>
            </div>

            <!-- Form -->
            <form
                else
                class="space-y-6"
                @submit.prevent="submit"
            >
                <!-- Carrera -->
                <FormRemoteSelect
                    ref="careerSelectRef"
                    label="Carrera"
                    v-model="form.careerId"
                    :endpoint="API.SUPERADMIN_API.careers.list"
                    :endpoint-by-id="API.SUPERADMIN_API.careers.byId"
                    item-label="name"
                    item-value="id"
                    :disabled="isApproved"
                    uppercase
                    required
                />

                <!-- Clave oficial -->
                <FormInput
                    label="Clave oficial"
                    v-model="form.officialCode"
                    uppercase
                    required
                />

                <!-- Tipo de periodo -->
                <FormSelect
                    label="Tipo de periodo"
                    v-model="form.periodType"
                    :options="periodTypeOptions"
                    required
                />

                <!-- Número de periodos -->
                <FormInput
                    label="Número de periodos"
                    type="number"
                    v-model.number="form.periods"
                    required
                />

                <!-- Año de inicio -->
                <FormInput
                    label="Año de inicio"
                    type="number"
                    v-model.number="form.startYear"
                    required
                />

                <!-- Actions -->
                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button
                        type="button"
                        class="px-4 py-2 text-sm border rounded-lg"
                        @click="goBack"
                    >
                        CANCELAR
                    </button>

                    <button
                        type="submit"
                        class="px-4 py-2 text-sm rounded-lg
                               bg-blue-600 text-white hover:bg-blue-700
                               disabled:opacity-60"
                        :disabled="submitting"
                    >
                        ACTUALIZAR
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum'
import { PeriodTypeEnum } from '@/shared/enums/period-type.enum'
import type { StudyPlanType } from '@/modules/superadmin/types/study-plan.type'

/* -------------------------------------------------------------------------- */
/* ROUTER */
/* -------------------------------------------------------------------------- */
const route = useRoute()
const router = useRouter()

/* -------------------------------------------------------------------------- */
/* REFS */
/* -------------------------------------------------------------------------- */
const careerSelectRef = ref<InstanceType<typeof FormRemoteSelect> | null>(null)

/* -------------------------------------------------------------------------- */
/* STATE */
/* -------------------------------------------------------------------------- */
const loading = ref(true)
const loaded = ref(false)
const submitting = ref(false)

const studyPlan = ref<StudyPlanType>({} as StudyPlanType)

const form = reactive({
    careerId: null as number | null,
    officialCode: '',
    periodType: PeriodTypeEnum.SEMESTER,
    periods: 0,
    startYear: new Date().getFullYear(),
})

/* -------------------------------------------------------------------------- */
/* FETCH */
/* -------------------------------------------------------------------------- */
async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.studyPlans.byId(route.params.id)
        )

        studyPlan.value = data

        // map form
        form.careerId = data.careerId ?? null
        form.officialCode = data.officialCode
        form.periodType = data.periodType
        form.periods = data.periods
        form.startYear = data.startYear

        loaded.value = true
    } finally {
        loading.value = false
    }
}

/* -------------------------------------------------------------------------- */
/* COMPUTED */
/* -------------------------------------------------------------------------- */
const isApproved = computed(() =>
    studyPlan.value.approvalStatus === ApprovalStatusEnum.APPROVED
)

const periodTypeOptions = [
    { label: 'Semestral', value: PeriodTypeEnum.SEMESTER },
    { label: 'Cuatrimestral', value: PeriodTypeEnum.QUARTER },
    { label: 'Trimestral', value: PeriodTypeEnum.TRIMESTER },
]

/* -------------------------------------------------------------------------- */
/* ACTIONS */
/* -------------------------------------------------------------------------- */
function goBack() {
    router.back()
}

async function submit() {
    submitting.value = true
    try {
        await api.put(
            API.SUPERADMIN_API.studyPlans.update(studyPlan.value.id),
            {
                career_id: form.careerId,
                official_code: form.officialCode,
                period_type: form.periodType,
                periods: form.periods,
                start_year: form.startYear,
            }
        )

        router.push({
            name: 'superadmin.studyplans.show',
            params: { id: studyPlan.value.id },
        })
    } finally {
        submitting.value = false
    }
}

/* -------------------------------------------------------------------------- */
/* INIT */
/* -------------------------------------------------------------------------- */
onMounted(fetchData)
</script>
