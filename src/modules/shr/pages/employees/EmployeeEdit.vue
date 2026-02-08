<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Editar empleado
            </h1>

            <div class="flex items-center gap-2">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                    @click="goBack"
                >
                    Cancelar
                </button>

                <button
                    class="px-4 py-2 text-sm rounded-lg
                           bg-blue-600 text-white hover:bg-blue-700
                           disabled:opacity-60"
                    :disabled="submitting || hasErrors"
                    @click="submit"
                >
                    Guardar cambios
                </button>
            </div>
        </div>

        <!-- Card -->
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-8 relative">
            <!-- Overlay -->
            <div
                v-if="loading"
                class="absolute inset-0 bg-white/70 z-10
                       flex items-center justify-center"
            >
                <span class="text-sm text-slate-500">
                    Cargando información…
                </span>
            </div>

            <!-- Avatar -->
            <section class="flex items-center gap-6">
                <img
                    src="/img/anonimus.jpg"
                    alt="Avatar empleado"
                    class="w-24 h-24 rounded-full border object-cover"
                />

                <div>
                    <p class="text-sm font-medium text-slate-700">
                        Avatar del empleado
                    </p>
                    <p class="text-xs text-slate-500">
                        (Próximamente editable)
                    </p>
                </div>
            </section>

            <!-- Datos personales -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    Datos personales
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormInput
                        label="Nombres"
                        v-model="form.names"
                        required
                        uppercase
                        @validation-error="setError('names', $event)"
                    />

                    <FormInput
                        label="Apellido paterno"
                        v-model="form.firstSurname"
                        required
                        uppercase
                        @validation-error="setError('firstSurname', $event)"
                    />

                    <FormInput
                        label="Apellido materno"
                        v-model="form.secondSurname"
                        uppercase
                    />

                    <FormCURPInput
                        label="CURP"
                        v-model="form.curp"
                        @validation-error="setError('curp', $event)"
                    />

                    <FormRFCInput
                        label="RFC"
                        v-model="form.rfc"
                        @validation-error="setError('rfc', $event)"
                    />

                    <FormPhoneInput
                        label="Teléfono"
                        v-model="form.phone"
                        @validation-error="setError('phone', $event)"
                    />
                </div>
            </section>

            <!-- Información laboral -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    Información laboral
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormInput
                        label="Fecha de contratación"
                        type="date"
                        v-model="form.hireDate"
                        required
                        @validation-error="setError('hireDate', $event)"
                    />

                    <FormInput
                        label="Fecha de baja"
                        type="date"
                        v-model="form.fireDate"
                    />

                    <FormSelect
                        label="Estado"
                        v-model="form.status"
                        :options="statusOptions"
                        required
                        @validation-error="setError('status', $event)"
                    />
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { mapEmployeeUpdatePayload } from '@/shared/api/mappers/employee.mapper'

import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import FormCURPInput from '@/app/components/ui/form/FormCURPInput.vue'
import FormRFCInput from '@/app/components/ui/form/FormRFCInput.vue'
import FormPhoneInput from '@/app/components/ui/form/FormPhoneInput.vue'

/* -------------------------------------------------------------------------- */
/* ROUTER */
/* -------------------------------------------------------------------------- */
const route = useRoute()
const router = useRouter()

/* -------------------------------------------------------------------------- */
/* STATE */
/* -------------------------------------------------------------------------- */
const loading = ref(true)
const submitting = ref(false)

/* -------------------------------------------------------------------------- */
/* FORM */
/* -------------------------------------------------------------------------- */
const form = reactive({
    names: '',
    firstSurname: '',
    secondSurname: '',
    curp: '',
    rfc: '',
    phone: '',
    hireDate: '',
    fireDate: '',
    status: true,
})

/* -------------------------------------------------------------------------- */
/* STATUS OPTIONS (🚨 AQUÍ ESTABA EL ERROR) */
/* -------------------------------------------------------------------------- */
const statusOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
]

/* -------------------------------------------------------------------------- */
/* ERRORS CENTRALIZADOS */
/* -------------------------------------------------------------------------- */
const errors = reactive<Record<string, string | null>>({})

function setError(field: string, error: string | null) {
    errors[field] = error
}

const hasErrors = computed(() =>
    Object.values(errors).some(e => e !== null)
)

/* -------------------------------------------------------------------------- */
/* FETCH */
/* -------------------------------------------------------------------------- */
async function fetchEmployee() {
    loading.value = true
    try {
        const { data } = await api.get(API.SHR_API.employee.byId(route.params.id))

        Object.assign(form, {
            names: data.names,
            firstSurname: data.firstSurname,
            secondSurname: data.secondSurname,
            curp: data.curp,
            rfc: data.rfc,
            phone: data.phone,
            hireDate: data.hireDate,
            fireDate: data.fireDate,
            status: data.status,
        })
    } finally {
        loading.value = false
    }
}

/* -------------------------------------------------------------------------- */
/* SUBMIT */
/* -------------------------------------------------------------------------- */
async function submit() {
    if (hasErrors.value) return

    submitting.value = true
    try {
        await api.put(API.SHR_API.employee.update(route.params.id), mapEmployeeUpdatePayload(form))

        router.push({
            name: 'shr.humanresources.employees.show',
            params: { id: route.params.id },
        })
    } finally {
        submitting.value = false
    }
}

function goBack() {
    router.back()
}

onMounted(fetchEmployee)
</script>
