<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">REGISTRAR ASPIRANTE</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormInput label="NOMBRE(S)" v-model="form.names" uppercase />
                <FormInput label="PRIMER APELLIDO" v-model="form.first_surname" uppercase />
                <FormInput label="SEGUNDO APELLIDO" v-model="form.second_surname" uppercase />
                <FormInput label="EMAIL" v-model="form.email" type="email" />
                <FormInput label="TELÉFONO" v-model="form.phone" />
                <FormInput label="CURP" v-model="form.curp" uppercase :maxlength="18" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <!-- Oferta Académica -->
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">OFERTA ACADÉMICA</label>
                    <select
                        v-model="form.academic_offer_id"
                        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Seleccionar</option>
                        <option v-for="opt in offerOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                </div>

                <!-- Periodo Académico -->
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">PERIODO ACADÉMICO</label>
                    <select
                        v-model="form.academic_period_id"
                        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Seleccionar</option>
                        <option v-for="opt in periodOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormSelect label="ESTADO" v-model="form.status" :options="statusOptions" />
                <FormInput label="FOLIO DE SOLICITUD" v-model="form.application_folio" uppercase />
                <FormInput label="ESCUELA DE ORIGEN" v-model="form.origin_school" uppercase />
                <FormInput label="PUNTAJE DE INGRESO" v-model="form.entrance_score" type="number" step="0.01" />
            </div>

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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import { STATUS_OPTIONS } from '@/modules/admissions/types/applicant.type'

const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)

const offerOptions = ref<{ value: number; label: string }[]>([])
const periodOptions = ref<{ value: number; label: string }[]>([])

const statusOptions = STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))

const form = ref({
    names: '',
    first_surname: '',
    second_surname: '',
    email: '',
    phone: '',
    curp: '',
    academic_offer_id: '' as number | '',
    academic_period_id: '' as number | '',
    status: 1 as number,
    application_folio: '',
    origin_school: '',
    entrance_score: '' as string | '',
})

async function loadOptions() {
    const [offersRes, periodsRes] = await Promise.all([
        api.get(API.SCHOOL_SERVICES_API.academicOffers.list),
        api.get(API.SUPERADMIN_API.academicPeriods.list),
    ])
    const offersData = offersRes.data?.data ?? offersRes.data
    offerOptions.value = (Array.isArray(offersData) ? offersData : []).map((o: any) => ({
        value: o.id,
        label: o.career?.name ?? `Oferta #${o.id}`,
    }))
    const periodsData = periodsRes.data?.data ?? periodsRes.data
    periodOptions.value = (Array.isArray(periodsData) ? periodsData : []).map((p: any) => ({
        value: p.id,
        label: p.name ?? `Periodo #${p.id}`,
    }))
}

async function submit() {
    error.value = null
    submitting.value = true
    try {
        const payload = {
            academic_offer_id:  form.value.academic_offer_id || null,
            academic_period_id: form.value.academic_period_id || null,
            names:              form.value.names,
            first_surname:      form.value.first_surname,
            second_surname:     form.value.second_surname || null,
            email:              form.value.email,
            phone:              form.value.phone || null,
            curp:               form.value.curp || null,
            status:             form.value.status,
            application_folio:  form.value.application_folio || null,
            origin_school:      form.value.origin_school || null,
            entrance_score:     form.value.entrance_score !== '' ? form.value.entrance_score : null,
        }
        const { data } = await api.post(API.ADMISSIONS_API.applicants.create, payload)
        router.push({ name: 'admissions.applicants.show', params: { id: data.id } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

onMounted(loadOptions)
</script>
