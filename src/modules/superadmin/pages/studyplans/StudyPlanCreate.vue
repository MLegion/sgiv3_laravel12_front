<template>
    <div class="max-w-4xl space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                REGISTRAR - PLAN DE ESTUDIO
            </h1>

            <button
                type="button"
                class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                @click="goBack"
            >
                VOLVER
            </button>
        </div>

        <!-- Card -->
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6">
            <form @submit.prevent="submit" class="space-y-6">

                <!-- Carrera -->
                <FormRemoteSelect
                    label="CARRERA"
                    v-model="form.career_id"
                    :endpoint="API.SUPERADMIN_API.careers.list"
                    item-label="name"
                    item-value="id"
                    placeholder="BUSCAR CARRERA..."
                    required
                    uppercase
                />

                <!-- Clave oficial -->
                <FormInput
                    label="CLAVE OFICIAL"
                    v-model="form.official_code"
                    uppercase
                    maxlength="50"
                    required
                />

                <!-- Tipo de periodo -->
                <FormSelect
                    label="TIPO DE PERIODO"
                    v-model="form.period_type"
                    :options="periodTypeOptions"
                    required
                />

                <!-- Número de periodos -->
                <FormInput
                    label="NÚMERO DE PERIODOS"
                    v-model.number="form.periods"
                    type="number"
                    min="1"
                    required
                />

                <!-- Año inicio -->
                <FormInput
                    label="AÑO DE INICIO"
                    v-model.number="form.start_year"
                    type="number"
                    min="1900"
                    max="2100"
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
                        GUARDAR
                    </button>
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

import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

import { PeriodTypeEnum } from '@/shared/enums/period-type.enum'

const router = useRouter()
const submitting = ref(false)

/* -------------------------------------------------------------------------- */
/* FORM STATE */
/* -------------------------------------------------------------------------- */
const form = reactive({
    career_id: null as number | null,
    official_code: '',
    period_type: PeriodTypeEnum.SEMESTER,
    periods: null as number | null,
    start_year: new Date().getFullYear(),
})

/* -------------------------------------------------------------------------- */
/* OPTIONS */
/* -------------------------------------------------------------------------- */
const periodTypeOptions = [
    { label: 'SEMESTRAL', value: PeriodTypeEnum.SEMESTER },
    { label: 'CUATRIMESTRAL', value: PeriodTypeEnum.QUARTER },
    { label: 'TRIMESTRAL', value: PeriodTypeEnum.TRIMESTER },
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
        await api.post(API.SUPERADMIN_API.studyPlans.create, form)
        router.push({ name: 'superadmin.study-plans.index' })
    } finally {
        submitting.value = false
    }
}
</script>
