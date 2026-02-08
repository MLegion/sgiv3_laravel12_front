<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                DETALLES - INSTITUCIÓN EDUCATIVA
            </h1>

            <div class="flex items-center gap-2">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                    @click="goBack"
                >
                    VOLVER
                </button>

                <button
                    class="px-3 py-2 text-sm rounded-lg
                           bg-amber-600 text-white hover:bg-amber-700"
                    @click="goToEdit"
                >
                    EDITAR
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

            <!-- Header info -->
            <section class="flex items-center gap-6">
                <div class="w-20 h-20 rounded-lg border
                            flex items-center justify-center
                            bg-slate-50 text-slate-400 text-3xl font-semibold">
                    {{ college.shortName || '—' }}
                </div>

                <div>
                    <h2 class="text-lg font-semibold text-slate-800">
                        {{ college.name || '—' }}
                    </h2>

                    <p class="text-sm text-slate-500">
                        Nombre corto: {{ college.shortName || '—' }}
                    </p>

                    <p class="text-xs text-slate-400 mt-1">
                        ID #{{ college.id || '—' }}
                    </p>
                </div>
            </section>

            <!-- Datos generales -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    DATOS GENERALES
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoItem
                        label="NOMBRE"
                        :value="college.name"
                    />

                    <InfoItem
                        label="NOMBRE CORTO"
                        :value="college.shortName"
                    />

                    <InfoItem
                        label="ESTADO"
                        :value="college.status ? 'ACTIVO' : 'INACTIVO'"
                    />
                </div>
            </section>

            <!-- Administrador -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    ADMINISTRADOR
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem
                        label="NOMBRE"
                        :value="college.admin?.name ?? '—'"
                    />

                    <InfoItem
                        label="CORREO"
                        :value="college.admin?.email ?? '—'"
                    />
                </div>
            </section>

            <!-- Metadata -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    INFORMACIÓN DEL SISTEMA
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoItem
                        label="CREADO"
                        :value="formatDate(college.createdAt)"
                    />

                    <InfoItem
                        label="ACTUALIZADO"
                        :value="formatDate(college.updatedAt)"
                    />
                </div>
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

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */
interface CollegeShow {
    id: number
    name: string
    shortName: string
    status: boolean
    admin?: {
        id: number
        name: string
        email: string
    } | null
    createdAt?: string
    updatedAt?: string
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
const college = ref<CollegeShow>({} as CollegeShow)

/* -------------------------------------------------------------------------- */
/* FETCH */
/* -------------------------------------------------------------------------- */
async function fetchCollege() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.colleges.byId(route.params.id)
        )
        college.value = data
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
        name: 'superadmin.colleges.edit',
        params: { id: college.value.id },
    })
}

function formatDate(date?: string | null) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString()
}

onMounted(fetchCollege)
</script>
