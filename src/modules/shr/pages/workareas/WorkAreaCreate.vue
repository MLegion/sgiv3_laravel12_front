<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Registrar área de trabajo
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
                    Registrar área
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
                    Guardando información…
                </span>
            </div>

            <!-- Información general -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    Información general
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormInput
                        label="Nombre del área"
                        v-model="form.name"
                        required
                        uppercase
                        @validation-error="setError('name', $event)"
                    />

                    <FormInput
                        label="Descripción"
                        v-model="form.description"
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
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'

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
const form = reactive<{
    name: string
    description: string | null
    status: boolean
}>({
    name: '',
    description: null,
    status: true,
})

/* -------------------------------------------------------------------------- */
/* STATUS OPTIONS */
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
/* SUBMIT (snake_case SOLO AQUÍ) */
/* -------------------------------------------------------------------------- */
async function submit() {
    if (hasErrors.value) return

    submitting.value = true
    try {
        await api.post(API.SHR_API.workArea.create, {
            name: form.name,
            description: form.description,
            status: form.status,
        })

        router.push({
            name: 'shr.humanresources.workareas',
        })
    } finally {
        submitting.value = false
    }
}

function goBack() {
    router.back()
}
</script>
