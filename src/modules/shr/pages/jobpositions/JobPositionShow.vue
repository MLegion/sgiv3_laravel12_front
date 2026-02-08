<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Información del puesto
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

                <button
                    class="px-3 py-2 text-sm rounded-lg
                           bg-red-600 text-white hover:bg-red-700"
                    @click="goToDelete"
                >
                    Eliminar
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

            <!-- Content -->
            <template v-if="!loading">
                <!-- General -->
                <section>
                    <h2 class="text-lg font-semibold text-slate-800">
                        {{ jobPosition.name }}
                    </h2>

                    <p class="text-sm text-slate-500 mt-1">
                        ID #{{ jobPosition.id }}
                    </p>
                </section>

                <!-- Información -->
                <section>
                    <h3 class="text-sm font-semibold text-slate-600 mb-4">
                        DETALLES
                    </h3>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoItem
                            label="Nombre"
                            :value="jobPosition.name"
                        />

                        <InfoItem
                            label="Estado"
                            :value="jobPosition.status ? 'ACTIVO' : 'INACTIVO'"
                        />
                    </div>
                </section>

                <!-- Descripción -->
                <section v-if="jobPosition.description">
                    <h3 class="text-sm font-semibold text-slate-600 mb-2">
                        DESCRIPCIÓN
                    </h3>

                    <p class="text-sm text-slate-700 whitespace-pre-line">
                        {{ jobPosition.description }}
                    </p>
                </section>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import InfoItem from '@/app/components/ui/InfoItem.vue'

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */
interface JobPositionShow {
    id: number
    name: string
    description?: string
    status: boolean
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
const jobPosition = ref<JobPositionShow>({} as JobPositionShow)

/* -------------------------------------------------------------------------- */
/* FETCH */
/* -------------------------------------------------------------------------- */
async function fetchJobPosition() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SHR_API.jobPosition.byId(route.params.id)
        )

        jobPosition.value = data
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
        name: 'shr.humanresources.jobpositions.edit',
        params: { id: jobPosition.value.id },
    })
}

function goToDelete() {
    router.push({
        name: 'shr.humanresources.jobpositions.delete',
        params: { id: jobPosition.value.id },
    })
}

onMounted(fetchJobPosition)
</script>
