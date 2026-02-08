<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Registrar empleado
            </h1>

            <div class="flex items-center gap-2">
                <button
                    type="button"
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                    @click="goBack"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    class="px-4 py-2 text-sm rounded-lg
                           bg-blue-600 text-white hover:bg-blue-700
                           disabled:opacity-60"
                    :disabled="submitting || hasErrors"
                    @click="submit"
                >
                    Registrar empleado
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
                </div>
            </section>

            <!-- Cuenta de acceso -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    Cuenta de acceso
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormEmailInput
                        label="Correo electrónico"
                        v-model="form.email"
                        required
                        @validation-error="setError('email', $event)"
                    />
                </div>
            </section>

            <!-- Información laboral -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    Información laboral
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Puesto -->
                    <FormSearchSelect
                        label="Puesto"
                        placeholder="Buscar puesto…"
                        v-model="selectedJobPosition"
                        :options="jobPositions"
                        required
                        labelKey="name"
                        valueKey="id"
                        @validation-error="setError('jobPositionId', $event)"
                    />
                </div>

                <!-- Contextos dinámicos -->
                <div
                    v-if="contextFields.length"
                    class="mt-6"
                >
                    <h4 class="text-xs font-semibold text-slate-500 mb-3">
                        Contextos requeridos
                    </h4>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormInput
                            v-for="ctx in contextFields"
                            :key="ctx.key"
                            :label="ctx.label"
                            v-model="form.contexts[ctx.key]"
                            required
                            @validation-error="setContextError(ctx.key, $event)"
                        />
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { mapEmployeeCreatePayload } from '@/shared/api/mappers/employee.mapper.ts'

import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormEmailInput from '@/app/components/ui/form/FormEmailInput.vue'
import FormSearchSelect from '@/app/components/ui/form/FormSearchSelect.vue'

/* -------------------------------------------------------------------------- */
/* ROUTER */
/* -------------------------------------------------------------------------- */
const router = useRouter()

/* -------------------------------------------------------------------------- */
/* STATE */
/* -------------------------------------------------------------------------- */
const loading = ref(false)
const submitting = ref(false)

/* -------------------------------------------------------------------------- */
/* FORM (camelCase SIEMPRE) */
/* -------------------------------------------------------------------------- */
const form = reactive<{
    names: string
    firstSurname: string
    secondSurname: string | null
    email: string
    jobPositionId: number | null
    contexts: Record<string, string>
}>({
    names: '',
    firstSurname: '',
    secondSurname: '',
    email: '',
    jobPositionId: null,
    contexts: {},
})

/* -------------------------------------------------------------------------- */
/* JOB POSITIONS */
/* -------------------------------------------------------------------------- */
const jobPositions = ref<any[]>([])
const selectedJobPosition = ref<any | null>(null)

/* Contextos requeridos por el puesto */
const contextFields = computed(() =>
    selectedJobPosition.value?.contexts ?? []
)

/* -------------------------------------------------------------------------- */
/* ERRORS CENTRALIZADOS */
/* -------------------------------------------------------------------------- */
const errors = reactive<Record<string, string | null>>({})

function setError(field: string, error: string | null) {
    errors[field] = error
}

function setContextError(key: string, error: string | null) {
    errors[`context.${key}`] = error
}

const hasErrors = computed(() =>
    Object.values(errors).some(e => e !== null)
)

/* -------------------------------------------------------------------------- */
/* WATCHERS */
/* -------------------------------------------------------------------------- */
watch(selectedJobPosition, value => {
    form.jobPositionId = value?.id ?? null
    form.contexts = {}
})

/* -------------------------------------------------------------------------- */
/* FETCH */
/* -------------------------------------------------------------------------- */
async function fetchJobPositions() {
    loading.value = true
    try {
        const { data } = await api.get(API.SHR_API.jobPosition.all)
        jobPositions.value = data.items
    } finally {
        loading.value = false
    }
}

/* -------------------------------------------------------------------------- */
/* SUBMIT (snake_case SOLO AQUÍ) */
/* -------------------------------------------------------------------------- */
async function submit() {
    if (hasErrors.value) return

    submitting.value = true
    try {
        await api.post(API.SHR_API.employee.create, mapEmployeeCreatePayload(form))

        router.push({
            name: 'shr.humanresources.employees',
        })
    } finally {
        submitting.value = false
    }
}

function goBack() {
    router.back()
}

onMounted(fetchJobPositions)
</script>
