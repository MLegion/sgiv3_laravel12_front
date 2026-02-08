<template>
    <div class="max-w-4xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-red-700">
                Eliminar empleado
            </h1>

            <button
                class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                :disabled="deleting"
                @click="goBack"
            >
                Cancelar
            </button>
        </div>

        <!-- Card -->
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <!-- Overlay -->
            <div
                v-if="loading || deleting"
                class="absolute inset-0 bg-white/70 z-10
                       flex items-center justify-center"
            >
                <span class="text-sm text-slate-500">
                    {{ deleting ? 'Eliminando empleado…' : 'Cargando información…' }}
                </span>
            </div>

            <!-- Empleado -->
            <section class="flex items-center gap-6">
                <img
                    src="/img/anonimus.jpg"
                    alt="Avatar empleado"
                    class="w-24 h-24 rounded-full border object-cover"
                />

                <div>
                    <h2 class="text-lg font-semibold text-slate-800">
                        {{ employee.names }}
                        {{ employee.firstSurname }}
                        {{ employee.secondSurname ?? '' }}
                    </h2>

                    <p class="text-sm text-slate-500">
                        {{ employee.currentJobPosition?.name || 'Sin puesto asignado' }}
                    </p>

                    <p class="text-xs text-slate-400 mt-1">
                        {{ employee.email }}
                    </p>
                </div>
            </section>

            <!-- Advertencia -->
            <section
                class="border border-red-200 bg-red-50 rounded-lg p-4 space-y-2"
            >
                <div class="flex items-start gap-3">
                    <!-- Icono advertencia -->
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-6 h-6 text-red-600 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="1.5"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 9v3.75m0 3.75h.008M10.29 3.86l-7.4 12.81a1.5 1.5 0 001.3 2.23h14.82a1.5 1.5 0 001.3-2.23l-7.4-12.81a1.5 1.5 0 00-2.6 0z"
                        />
                    </svg>

                    <div class="space-y-1">
                        <p class="text-sm font-semibold text-red-700">
                            ¿Estás seguro que deseas eliminar este empleado?
                        </p>

                        <p class="text-sm text-red-600">
                            Esta acción es <strong>irreversible</strong>.
                            Se eliminará el registro del empleado y su relación laboral.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Acciones -->
            <section class="flex justify-end gap-3">
                <button
                    class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-100"
                    :disabled="deleting"
                    @click="goBack"
                >
                    Cancelar
                </button>

                <button
                    class="px-4 py-2 text-sm rounded-lg
                           bg-red-600 text-white hover:bg-red-700
                           disabled:opacity-60"
                    :disabled="deleting"
                    @click="confirmDelete"
                >
                    Eliminar
                </button>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { EmployeeShowType } from '@/modules/shr/types/employee.show.type'

/* -------------------------------------------------------------------------- */
/* ROUTER */
/* -------------------------------------------------------------------------- */
const route = useRoute()
const router = useRouter()

/* -------------------------------------------------------------------------- */
/* STATE */
/* -------------------------------------------------------------------------- */
const loading = ref(true)
const deleting = ref(false)
const employee = ref<EmployeeShowType>({} as EmployeeShowType)

/* -------------------------------------------------------------------------- */
/* FETCH */
/* -------------------------------------------------------------------------- */
async function fetchEmployee() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SHR_API.employee.byId(route.params.id)
        )
        employee.value = data
    } finally {
        loading.value = false
    }
}

/* -------------------------------------------------------------------------- */
/* DELETE */
/* -------------------------------------------------------------------------- */
async function confirmDelete() {
    if (deleting.value) return

    deleting.value = true
    try {
        await api.delete(
            API.SHR_API.employee.delete(route.params.id)
        )

        router.push({
            name: 'shr.humanresources.employees.index',
        })
    } finally {
        deleting.value = false
    }
}

function goBack() {
    router.back()
}

onMounted(fetchEmployee)
</script>
