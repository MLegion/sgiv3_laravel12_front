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

        <!-- Error general del backend (reglas de negocio, conflictos, servidor) -->
        <div
            v-if="generalError"
            class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3"
        >
            {{ generalError }}
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
                        :error="errors.collegeName"
                        @validation-error="setError('collegeName', $event)"
                    />

                    <FormInput
                        label="NOMBRE CORTO"
                        v-model="form.collegeShortName"
                        required
                        uppercase
                        :error="errors.collegeShortName"
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
                        :error="errors.employeeName"
                        @validation-error="setError('employeeName', $event)"
                    />

                    <FormInput
                        label="PRIMER APELLIDO"
                        v-model="form.employeeFirstSurname"
                        required
                        uppercase
                        :error="errors.employeeFirstSurname"
                        @validation-error="setError('employeeFirstSurname', $event)"
                    />

                    <FormInput
                        label="SEGUNDO APELLIDO"
                        v-model="form.employeeSecondSurname"
                        uppercase
                        :error="errors.employeeSecondSurname"
                        @validation-error="setError('employeeSecondSurname', $event)"
                    />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormEmailInput
                        label="CORREO ELECTRÓNICO"
                        v-model="form.employeeEmail"
                        required
                        :error="errors.employeeEmail"
                        @validation-error="setError('employeeEmail', $event)"
                    />

                    <FormInput
                        label="CONTRASEÑA (OPCIONAL)"
                        type="password"
                        v-model="form.password"
                        placeholder="Mínimo 8 caracteres"
                        :error="errors.password"
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
// Error general (reglas de negocio del backend que no corresponden a un campo).
const generalError = ref<string | null>(null)

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
    Object.values(errors).some(e => e !== null && e !== undefined)
)

/** snake_case (payload/back) → camelCase (campos del form). */
function toCamel(s: string): string {
    return s.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())
}

/* -------------------------------------------------------------------------- */
/* SUBMIT */
/* -------------------------------------------------------------------------- */
async function submit() {
    if (hasErrors.value) return

    generalError.value = null
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
        handleSubmitError(e)
    } finally {
        submitting.value = false
    }
}

/** Muestra CUALQUIER error del backend: validación por campo o mensaje de negocio. */
function handleSubmitError(e: any) {
    const res = e?.response
    const data = res?.data

    // 1) Errores de validación (422): mapear a cada campo (snake_case → camelCase).
    if (res?.status === 422 && data?.errors) {
        const generales: string[] = []
        Object.entries(data.errors).forEach(([key, messages]: any) => {
            const field = toCamel(key)
            const msg = Array.isArray(messages) ? messages[0] : String(messages)
            if (field in form) {
                errors[field] = msg
            } else {
                generales.push(msg)
            }
        })
        generalError.value = generales.length
            ? generales.join(' ')
            : (data.message && !/given data was invalid/i.test(data.message) ? data.message : null)
        if (!generalError.value && !Object.values(errors).some(x => x)) {
            generalError.value = 'No se pudo registrar la institución. Revisa los datos.'
        }
        return
    }

    // 2) Regla de negocio / conflicto / error del servidor con mensaje.
    generalError.value = data?.message
        || data?.error
        || (res
            ? `No se pudo registrar la institución (error ${res.status}).`
            : 'No se pudo conectar con el servidor. Intenta de nuevo.')
}

function goBack() {
    router.back()
}
</script>
