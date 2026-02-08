<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                REGISTRAR - INSTITUCIÓN EDUCATIVA
            </h1>

            <div class="flex items-center gap-2">
                <button
                    type="button"
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                    @click="goBack"
                >
                    VOLVER
                </button>

                <button
                    type="button"
                    class="px-4 py-2 text-sm rounded-lg
                           bg-blue-600 text-white hover:bg-blue-700
                           disabled:opacity-60"
                    :disabled="submitting || hasErrors"
                    @click="submit"
                >
                    REGISTRAR
                </button>
            </div>
        </div>

        <!-- Card -->
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-8 relative">
            <!-- Overlay -->
            <div
                v-if="submitting"
                class="absolute inset-0 bg-white/70 z-10
                       flex items-center justify-center"
            >
                <span class="text-sm text-slate-500">
                    REGISTRANDO INFORMACIÓN..
                </span>
            </div>

            <!-- College -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    INFORMACIÓN DE LA INSTITUCIÓN
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                        label="NOMBRE DE LA INSTITUCIÓN"
                        v-model="form.collegeName"
                        required
                        uppercase
                        @validation-error="setError('collegeName', $event)"
                    />

                    <FormInput
                        label="NOMBRE CORTO"
                        v-model="form.collegeShortName"
                        required
                        uppercase
                        @validation-error="setError('collegeShortName', $event)"
                    />
                </div>
            </section>

            <!-- Admin -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    ADMINISTRADOR INICIAL
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormInput
                        label="NOMBRE(S)"
                        v-model="form.employeeName"
                        required
                        uppercase
                        @validation-error="setError('employeeName', $event)"
                    />

                    <FormInput
                        label="PRIMER APELLIDO"
                        v-model="form.employeeFirstSurname"
                        required
                        uppercase
                        @validation-error="setError('employeeFirstSurname', $event)"
                    />

                    <FormInput
                        label="SEGUNDO APELLIDO"
                        v-model="form.employeeSecondSurname"
                        uppercase
                    />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormEmailInput
                        label="CORREO ELECTRÓNICO"
                        v-model="form.employeeEmail"
                        required
                        @validation-error="setError('employeeEmail', $event)"
                    />

                    <FormInput
                        label="CONTRASEÑA (OPCIONAL)"
                        type="password"
                        v-model="form.password"
                        placeholder="Mínimo 8 caracteres"
                        @validation-error="setError('password', $event)"
                    />
                </div>

                <p class="text-xs text-slate-500 mt-2">
                    SI NO SE ESPECIFICA UNA CONTRASEÑA, EL SISTEMA PODRÁ GENERAR UNA AUTOMÁTICAMENTE.
                </p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormEmailInput from '@/app/components/ui/form/FormEmailInput.vue'

import { mapCollegeCreateWithAdminPayload } from '@/shared/api/mappers/college.mapper.ts'
/* -------------------------------------------------------------------------- */
/* ROUTER */
/* -------------------------------------------------------------------------- */
const router = useRouter()

/* -------------------------------------------------------------------------- */
/* STATE */
/* -------------------------------------------------------------------------- */
const submitting = ref(false)

/* -------------------------------------------------------------------------- */
/* FORM (camelCase SIEMPRE) */
/* -------------------------------------------------------------------------- */
const form = reactive({
    collegeName: '',
    collegeShortName: '',

    employeeName: '',
    employeeFirstSurname: '',
    employeeSecondSurname: '',
    employeeEmail: '',

    password: '',
})

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
/* SUBMIT */
/* -------------------------------------------------------------------------- */
async function submit() {
    if (hasErrors.value) return

    submitting.value = true
    try {
        await api.post(
            API.SUPERADMIN_API.colleges.createWithAdmin,
            mapCollegeCreateWithAdminPayload(form)
        )

        router.push({
            name: 'superadmin.colleges',
        })
    } catch (e: any) {
        if (e.response?.status === 422 && e.response.data?.errors) {
            Object.entries(e.response.data.errors).forEach(
                ([key, messages]: any) => {
                    errors[key] = messages[0]
                }
            )
        }
    } finally {
        submitting.value = false
    }
}

function goBack() {
    router.back()
}
</script>
