<template>
    <div class="max-w-3xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Registrar Escuela de Procedencia</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div v-if="submitting" class="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-xl">
                <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span class="text-sm text-slate-500 font-bold uppercase">GUARDANDO...</span>
            </div>

            <form class="space-y-6" @submit.prevent="submit">
                <!-- Datos de identificación -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="NOMBRE DE LA ESCUELA" v-model="form.name" uppercase required class="md:col-span-2" />
                    <FormInput label="SIGLAS" v-model="form.shortName" uppercase />
                    <FormInput label="CCT (CLAVE DE CENTRO DE TRABAJO)" v-model="form.cct" uppercase />
                    <FormSelect label="NIVEL EDUCATIVO" v-model="form.schoolLevel" :options="schoolLevelOptions" />
                </div>

                <!-- Datos de contacto -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="TELÉFONO" v-model="form.phone" />
                    <FormInput label="CORREO ELECTRÓNICO" v-model="form.email" type="email" />
                </div>

                <!-- Dirección geográfica -->
                <GeoAddressFields
                    :address="form.address"
                    :geo-settlement-id="form.geoSettlementId"
                    @update:address="form.address = $event"
                    @update:geo-settlement-id="form.geoSettlementId = $event"
                />

                <FormSwitch label="ACTIVA" v-model="form.statusBool" />

                <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">
                        CANCELAR
                    </button>
                    <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" :disabled="submitting">
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
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import GeoAddressFields from '@/app/components/ui/form/GeoAddressFields.vue'
import { SCHOOL_LEVEL_OPTIONS } from '@/modules/admissions/types/origin-school.type'

const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)

const schoolLevelOptions = SCHOOL_LEVEL_OPTIONS.map(o => ({ value: o.value, label: o.label }))

const form = reactive({
    name: '',
    shortName: '',
    cct: '',
    schoolLevel: '' as string,
    address: '',
    geoSettlementId: null as number | null,
    phone: '',
    email: '',
    statusBool: true,
})

async function submit() {
    error.value = null
    submitting.value = true
    try {
        const { data } = await api.post(API.ADMISSIONS_API.originSchools.create, {
            name:               form.name,
            short_name:         form.shortName || null,
            cct:                form.cct || null,
            school_level:       form.schoolLevel || null,
            address:            form.address || null,
            geo_settlement_id:  form.geoSettlementId,
            phone:              form.phone || null,
            email:              form.email || null,
            status:             form.statusBool ? 1 : 0,
        })
        router.push({ name: 'admissions.origin-schools.show', params: { id: data.id } })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}
</script>
