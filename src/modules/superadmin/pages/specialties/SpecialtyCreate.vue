<template>
    <div class="max-w-4xl space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                REGISTRAR - ESPECIALIDAD
            </h1>

            <button
                type="button"
                class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100 transition-colors"
                @click="goBack"
            >
                VOLVER
            </button>
        </div>

        <!-- Card -->
        <div class="bg-white border rounded-xl shadow-sm p-6">
            <form @submit.prevent="submit" class="space-y-6">

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Plan de Estudios (Obligatorio según migración) -->
                    <FormRemoteSelect
                        label="PLAN DE ESTUDIOS"
                        v-model="form.study_plan_id"
                        :endpoint="API.SUPERADMIN_API.studyPlans.list"
                        :itemSearchs="['official_code']"
                        item-label="officialCode"
                        item-value="id"
                        placeholder="BUSCAR PLAN..."
                        required
                        class="md:col-span-2"
                    />
                    <!-- Clave Oficial (Unique en migración) -->
                    <FormInput
                        label="CLAVE OFICIAL"
                        v-model="form.official_code"
                        uppercase
                        maxlength="30"
                        required
                    />

                    <!-- Nombre de la especialidad -->
                    <FormInput
                        label="NOMBRE DE LA ESPECIALIDAD"
                        v-model="form.name"
                        uppercase
                        maxlength="255"
                        required
                        class="md:col-span-2"
                    />

                    <!-- Nombre Corto -->
                    <FormInput
                        label="NOMBRE CORTO"
                        v-model="form.short_name"
                        uppercase
                        maxlength="50"
                    />
                </div>

                <!-- Actions -->
                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button
                        type="button"
                        class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition-colors"
                        @click="goBack"
                    >
                        CANCELAR
                    </button>

                    <button
                        type="submit"
                        class="px-4 py-2 text-sm rounded-lg
                               bg-blue-600 text-white hover:bg-blue-700
                               disabled:opacity-60 transition-colors"
                        :disabled="submitting"
                    >
                        {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
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

const router = useRouter()
const submitting = ref(false)

/* -------------------------------------------------------------------------- */
/* FORM STATE */
/* -------------------------------------------------------------------------- */
const form = reactive({
    study_plan_id: null as number | null,
    college_id: null as number | null,
    name: '',
    short_name: '',
    official_code: '',
    is_active: true,
    // Nota: created_by se suele manejar en el Backend (Auth::id())
    // approval_status se inicializa como 'draft' por defecto en DB
})

/* -------------------------------------------------------------------------- */
/* OPTIONS */
/* -------------------------------------------------------------------------- */
const statusOptions = [
    { label: 'ACTIVO', value: true },
    { label: 'INACTIVO', value: false },
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
        await api.post(API.SUPERADMIN_API.specialties.create, form)
        router.push({ name: 'superadmin.specialties' })
    } catch (error) {
        console.error('Error al guardar la especialidad:', error)
    } finally {
        submitting.value = false
    }
}
</script>
