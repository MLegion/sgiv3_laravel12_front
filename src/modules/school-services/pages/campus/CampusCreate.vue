<template>
    <div class="max-w-3xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Registrar Campus</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div v-if="submitting" class="absolute inset-0 bg-white/70 z-10 flex flex-col items-center justify-center rounded-xl">
                <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span class="text-sm text-slate-500 font-bold uppercase">GUARDANDO...</span>
            </div>

            <form class="space-y-6" @submit.prevent="submit">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="NOMBRE DEL CAMPUS" v-model="form.name" uppercase required />
                    <FormInput label="NOMBRE CORTO" v-model="form.shortName" uppercase />
                </div>

                <GeoAddressFields
                    :address="form.address"
                    :geo-settlement-id="form.geoSettlementId"
                    @update:address="form.address = $event"
                    @update:geo-settlement-id="form.geoSettlementId = $event"
                />

                <FormSwitch label="ACTIVO" v-model="form.status" />

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">
                        CANCELAR
                    </button>
                    <button type="submit" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" :disabled="submitting">
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
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import GeoAddressFields from '@/app/components/ui/form/GeoAddressFields.vue'

const router = useRouter()
const submitting = ref(false)

const form = reactive({
    name: '',
    shortName: '',
    address: '',
    geoSettlementId: null as number | null,
    status: true,
})

async function submit() {
    submitting.value = true
    try {
        await api.post(API.SCHOOL_SERVICES_API.campuses.create, {
            name:               form.name,
            short_name:         form.shortName || null,
            address:            form.address || null,
            geo_settlement_id:  form.geoSettlementId,
            status:             form.status,
        })
        router.push({ name: 'school-services.campuses' })
    } catch (error) {
        console.error('Error al guardar campus:', error)
    } finally {
        submitting.value = false
    }
}
</script>
