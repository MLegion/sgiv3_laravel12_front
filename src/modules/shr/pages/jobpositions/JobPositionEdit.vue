<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Editar puesto
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

            <!-- Información general -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    Información del puesto
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                        label="Nombre del puesto"
                        v-model="form.name"
                        required
                        uppercase
                        @validation-error="setError('name', $event)"
                    />

                    <FormSelect
                        label="Estado"
                        v-model="form.status"
                        :options="statusOptions"
                        required
                        @validation-error="setError('status', $event)"
                    />

                    <FormInput
                        label="Límite de personal"
                        type="number"
                        v-model="form.maxHolders"
                        placeholder="Sin límite"
                        :min="1"
                        hint="Deja vacío para no establecer límite"
                    />

                    <FormSelect
                        label="Rol asociado"
                        v-model="form.roleName"
                        :options="roleOptions"
                        hint="Al guardar, el rol se asigna/quita automáticamente a quienes ocupan el puesto"
                    />
                </div>

                <!-- Contexto por defecto (si el rol lo requiere) -->
                <JobPositionDefaultContext
                    :required-contexts="selectedRoleContexts"
                    v-model="form.defaultContext"
                />

                <div class="mt-4">
                    <FormInput
                        label="Descripción"
                        v-model="form.description"
                        placeholder="Descripción del puesto (opcional)"
                    />
                </div>
            </section>

            <!-- Avisos de propagación del rol -->
            <div v-if="propagationWarnings.length" class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p class="font-medium mb-1">El puesto se guardó, pero revisa:</p>
                <ul class="list-disc list-inside space-y-1">
                    <li v-for="(w, i) in propagationWarnings" :key="i">{{ w }}</li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import {
    mapJobPositionUpdatePayload,
} from '@/shared/api/mappers/job-position.mapper'

import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import JobPositionDefaultContext from '@/modules/shr/components/JobPositionDefaultContext.vue'

interface RoleItem {
    code: string
    name: string
    required_contexts: { alias: string; is_required: boolean; is_multiple: boolean }[]
}

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
    name: '',
    description: '',
    status: true,
    maxHolders: null as number | null,
    roleName: '' as string,
    defaultContext: null as Record<string, number | number[]> | null,
})

const propagationWarnings = ref<string[]>([])

/* -------------------------------------------------------------------------- */
/* ROLES ASIGNABLES */
/* -------------------------------------------------------------------------- */
const roles = ref<RoleItem[]>([])
const roleOptions = computed(() => [
    { label: 'Sin rol', value: '' },
    ...roles.value.map(r => ({ label: `${r.name} (${r.code})`, value: r.code })),
])
const selectedRoleContexts = computed(() =>
    roles.value.find(r => r.code === form.roleName)?.required_contexts ?? [],
)

async function fetchRoles() {
    try {
        const { data } = await api.get(API.SHR_API.jobPosition.assignableRoles)
        roles.value = (data.items ?? []) as RoleItem[]
    } catch { /* deja solo "Sin rol" */ }
}

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
/* FETCH */
/* -------------------------------------------------------------------------- */
async function fetchJobPosition() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SHR_API.jobPosition.byId(route.params.id)
        )

        // El endpoint `show` serializa la entidad en camelCase; se leen ambas
        // formas (camel/snake) por robustez.
        Object.assign(form, {
            name: data.name,
            description: data.description,
            status: data.status,
            maxHolders: data.maxHolders ?? data.max_holders ?? null,
            roleName: data.roleName ?? data.role_name ?? '',
            defaultContext: data.defaultContext ?? data.default_context ?? null,
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
    propagationWarnings.value = []
    try {
        const { data } = await api.put(
            API.SHR_API.jobPosition.update(route.params.id),
            mapJobPositionUpdatePayload(form)
        )

        const warns = data?.role_propagation?.warnings ?? []
        if (warns.length) {
            // Se guardó, pero hay avisos: los mostramos y no salimos de la página.
            propagationWarnings.value = warns
            return
        }

        router.push({ name: 'shr.humanresources.jobpositions' })
    } finally {
        submitting.value = false
    }
}

function goBack() {
    router.push({ name: 'shr.humanresources.jobpositions' })
}

onMounted(() => {
    fetchRoles()
    fetchJobPosition()
})
</script>
