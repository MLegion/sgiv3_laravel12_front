<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Información del empleado
            </h1>

            <div class="flex items-center gap-2">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                    @click="goBack"
                >
                    Volver
                </button>

                <button
                    class="px-3 py-2 text-sm rounded-lg
                           bg-amber-600 text-white hover:bg-amber-700"
                    @click="goToEdit"
                >
                    Editar
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
                <div class="relative">
                    <img
                        src="/img/anonimus.jpg"
                        alt="Avatar empleado"
                        class="w-28 h-28 rounded-full border border-slate-200 object-cover"
                    />

                    <!-- Estado -->
                    <span
                        class="absolute bottom-1 right-1 w-4 h-4 rounded-full
                               border-2 border-white"
                        :class="employee.status
                            ? 'bg-green-500'
                            : 'bg-red-500'"
                    />
                </div>

                <div>
                    <h2 class="text-lg font-semibold text-slate-800">
                        {{ employee.names || '—' }}
                        {{ employee.firstSurname || '' }}
                        {{ employee.secondSurname || '' }}
                    </h2>

                    <p class="text-sm text-slate-500">
                        {{ employee.currentJobPosition?.name || 'Sin puesto asignado' }}
                    </p>

                    <p class="text-xs text-slate-400 mt-1">
                        ID #{{ employee.id || '—' }}
                    </p>
                </div>
            </section>

            <!-- Datos personales -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    DATOS PERSONALES
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoItem label="NOMBRE(S)" :value="employee.names" />
                    <InfoItem label="APELLIDO PATERNO" :value="employee.firstSurname" />
                    <InfoItem label="APELLIDO MATERNO" :value="employee.secondSurname" />
                    <InfoItem label="CURP" :value="employee.curp" />
                    <InfoItem label="RFC" :value="employee.rfc" />
                    <InfoItem label="TELÉFONO" :value="employee.phone" />
                </div>
            </section>

            <!-- Cuenta de usuario -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    CUENTA DE USUARIO
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem label="CORREO" :value="employee.email" />
                    <InfoItem label="USUARIO DEL SISTEMA" :value="employee.user?.name" />
                </div>
            </section>

            <!-- Información laboral -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    INFORMACIÓN LABORAL
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoItem
                        label="PUESTO ACTUAL"
                        :value="employee.currentJobPosition?.name"
                    />
                    <InfoItem
                        label="FECHA DE CONTRATACIÓN"
                        :value="formatDate(employee.hireDate)"
                    />
                    <InfoItem
                        label="FECHA DE BAJA"
                        :value="
                            employee.fireDate
                                ? formatDate(employee.fireDate)
                                : null
                        "
                    />
                </div>
            </section>

            <!-- Estado -->
            <section>
                <InfoItem
                    label="ESTADO"
                    :value="employee.status ? 'ACTIVO' : 'INACTIVO'"
                />
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InfoItem from '@/app/components/ui/InfoItem.vue'
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
/* ACTIONS */
/* -------------------------------------------------------------------------- */
function goBack() {
    router.back()
}

function goToEdit() {
    router.push({
        name: 'shr.humanresources.employees.edit',
        params: { id: employee.value.id },
    })
}

function formatDate(date?: string | null) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString()
}

onMounted(fetchEmployee)
</script>
