<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Historial laboral
            </h1>

            <button
                class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                @click="goBack"
            >
                Volver
            </button>
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
                    Cargando historial…
                </span>
            </div>

            <!-- Employee -->
            <section>
                <h2 class="text-lg font-semibold text-slate-800">
                    {{ employee.names }}
                    {{ employee.firstSurname }}
                    {{ employee.secondSurname ?? '' }}
                </h2>

                <p class="text-sm text-slate-500">
                    {{ employee.email }}
                </p>
            </section>

            <!-- Historial -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    Historial de puestos
                </h3>

                <div v-if="!history.length" class="text-sm text-slate-500">
                    Sin historial registrado
                </div>

                <ul v-else class="space-y-3">
                    <li
                        v-for="item in visibleHistory"
                        :key="item.id"
                        class="flex items-center justify-between
                               border rounded-lg px-4 py-3"
                        :class="item.isCurrent
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-slate-200'"
                    >
                        <div>
                            <p class="text-sm font-medium text-slate-800">
                                {{ item.jobPosition.name }}
                            </p>

                            <p class="text-xs text-slate-500">
                                {{ formatDate(item.startDate) }}
                                —
                                {{ item.endDate ? formatDate(item.endDate) : 'Actual' }}
                            </p>
                        </div>

                        <span
                            v-if="item.isCurrent"
                            class="text-xs px-2 py-1 rounded-full
                                   bg-blue-100 text-blue-700"
                        >
                            Actual
                        </span>
                    </li>
                </ul>

                <div v-if="history.length > MAX_VISIBLE" class="mt-3">
                    <button
                        class="text-xs text-blue-600 hover:underline"
                        @click="showAllHistory = !showAllHistory"
                    >
                        {{ showAllHistory ? 'Ocultar historial' : 'Ver historial completo' }}
                    </button>
                </div>
            </section>

            <!-- Cambiar puesto -->
            <section class="border-t pt-6 space-y-4">
                <h3 class="text-sm font-semibold text-slate-600">
                    Asignar nuevo puesto
                </h3>

                <FormSearchSelect
                    label="Nuevo puesto"
                    placeholder="Buscar puesto…"
                    v-model="selectedJobPosition"
                    :options="jobPositions"
                    label-key="name"
                    value-key="id"
                    :error="assignError"
                />

                <!-- Selector de carreras (solo para career_manager) -->
                <div v-if="needsCareerContext" class="mt-4 space-y-2">
                    <label class="block text-xs font-semibold text-slate-600 uppercase">
                        Carreras asignadas
                    </label>
                    <p class="text-xs text-slate-400">
                        Selecciona las carreras que este jefe de carrera podrá gestionar.
                    </p>
                    <div v-if="loadingCareers" class="text-xs text-slate-400">Cargando carreras...</div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                        <label
                            v-for="c in careers" :key="c.id"
                            class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                :value="c.id"
                                v-model="selectedCareerIds"
                                class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span class="text-sm text-slate-700">{{ c.name }}</span>
                        </label>
                        <p v-if="careers.length === 0" class="text-xs text-slate-400 col-span-2">Sin carreras disponibles</p>
                    </div>
                    <p v-if="selectedCareerIds.length > 0" class="text-xs text-blue-600 font-semibold">
                        {{ selectedCareerIds.length }} carrera(s) seleccionada(s)
                    </p>
                </div>

                <div class="flex justify-end">
                    <button
                        class="px-4 py-2 text-sm rounded-lg
                               bg-blue-600 text-white hover:bg-blue-700
                               disabled:opacity-60"
                        :disabled="!canAssign || assigning"
                        @click="assignNewPosition"
                    >
                        Cambiar puesto
                    </button>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

import FormSearchSelect from '@/app/components/ui/form/FormSearchSelect.vue'
import type { EmployeeShowType } from '@/modules/shr/types/employee.show.type'

/* -------------------------------------------------------------------------- */
/* CONSTANTS */
/* -------------------------------------------------------------------------- */
const MAX_VISIBLE = 5

/* -------------------------------------------------------------------------- */
/* ROUTER */
/* -------------------------------------------------------------------------- */
const route = useRoute()
const router = useRouter()

/* -------------------------------------------------------------------------- */
/* STATE */
/* -------------------------------------------------------------------------- */
const loading = ref(true)
const assigning = ref(false)
const assignError = ref<string | null>(null)

const employee = ref<EmployeeShowType>({} as EmployeeShowType)
const history = ref<any[]>([])
const jobPositions = ref<any[]>([])
const selectedJobPosition = ref<any | null>(null)
const selectedCareerIds = ref<number[]>([])
const careers = ref<any[]>([])
const loadingCareers = ref(false)

const showAllHistory = ref(false)

/* -------------------------------------------------------------------------- */
/* COMPUTED */
/* -------------------------------------------------------------------------- */
const currentJobPositionId = computed(() =>
    history.value.find(h => h.isCurrent)?.jobPosition.id ?? null
)

const needsCareerContext = computed(() =>
    selectedJobPosition.value?.roleName === 'career_manager'
    || selectedJobPosition.value?.role_name === 'career_manager'
)

const canAssign = computed(() => {
    if (!selectedJobPosition.value) return false
    if (selectedJobPosition.value.id === currentJobPositionId.value) return false
    if (needsCareerContext.value && selectedCareerIds.value.length === 0) return false
    return true
})

const visibleHistory = computed(() =>
    showAllHistory.value
        ? history.value
        : history.value.slice(0, MAX_VISIBLE)
)

/* -------------------------------------------------------------------------- */
/* FETCH */
/* -------------------------------------------------------------------------- */
async function fetchData() {
    loading.value = true
    try {
        const [employeeRes, historyRes, jobsRes] = await Promise.all([
            api.get(API.SHR_API.employee.byId(route.params.id)),
            api.get(API.SHR_API.employee.history(route.params.id)),
            api.get(API.SHR_API.jobPosition.list),
        ])

        employee.value = employeeRes.data
        history.value = historyRes.data
        jobPositions.value = jobsRes.data.items || []
    } finally {
        loading.value = false
    }
}

/* -------------------------------------------------------------------------- */
/* CAREER CONTEXT */
/* -------------------------------------------------------------------------- */
watch(selectedJobPosition, () => {
    selectedCareerIds.value = []
    if (needsCareerContext.value) {
        fetchCareers()
    }
})

async function fetchCareers() {
    loadingCareers.value = true
    try {
        const { data } = await api.get(API.SUPERADMIN_API.careers.list, { params: { per_page: 200 } })
        careers.value = (data?.items ?? data?.data ?? []).map((c: any) => ({
            id: c.id,
            name: c.name ?? c.shortName ?? `Carrera #${c.id}`,
        }))
    } catch {
        careers.value = []
    } finally {
        loadingCareers.value = false
    }
}

/* -------------------------------------------------------------------------- */
/* ASSIGN */
/* -------------------------------------------------------------------------- */
async function assignNewPosition() {
    if (!canAssign.value) {
        assignError.value = 'El empleado ya tiene este puesto asignado.'
        return
    }

    assignError.value = null
    assigning.value = true

    try {
        const payload: Record<string, any> = {
            job_id: selectedJobPosition.value.id,
        }

        if (needsCareerContext.value && selectedCareerIds.value.length > 0) {
            payload.contexts = { career: selectedCareerIds.value }
        }

        await api.post(API.SHR_API.employee.assingJob(route.params.id), payload)

        await fetchData()
        selectedJobPosition.value = null
    } catch (error: any) {
        if (error.response?.status === 422) {
            assignError.value = error.response.data?.message
        }
    } finally {
        assigning.value = false
    }
}

/* -------------------------------------------------------------------------- */
/* HELPERS */
/* -------------------------------------------------------------------------- */
function goBack() {
    router.back()
}

function formatDate(date: string): string {
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

onMounted(fetchData)
</script>
