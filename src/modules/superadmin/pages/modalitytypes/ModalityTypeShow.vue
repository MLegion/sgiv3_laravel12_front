<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                DETALLES - TIPO DE MODALIDAD
            </h1>

            <div class="flex gap-2">
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
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
            <div
                v-if="loading"
                class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center"
            >
                <span class="text-sm text-slate-500">
                    Cargando información…
                </span>
            </div>

            <!-- Basic info -->
            <section class="space-y-2">
                <h2 class="text-lg font-semibold text-slate-800">
                    {{ modality.name }}
                </h2>

                <p class="text-sm text-slate-500">
                    CLAVE: {{ modality.shortName }}
                </p>

                <span
                    class="inline-block px-2 py-1 text-xs rounded-full"
                    :class="modality.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'"
                >
                    {{ modality.isActive ? 'ACTIVO' : 'INACTIVO' }}
                </span>
            </section>

            <!-- Config -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-2">
                    CONFIGURACIÓN
                </h3>

                <pre
                    class="bg-slate-50 border rounded-lg p-4 text-xs
                           overflow-auto text-slate-700"
                >
{{ formattedConfig }}
                </pre>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ModalityType } from '@/modules/superadmin/types/modality-type'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const modality = ref<ModalityType>({} as ModalityType)

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.modalityTypes.byId(route.params.id)
        )
        modality.value = data
    } finally {
        loading.value = false
    }
}

const formattedConfig = computed(() =>
    JSON.stringify(modality.value.config, null, 2)
)

function goBack() {
    router.back()
}

function goToEdit() {
    router.push({
        name: 'superadmin.modalitytypes.edit',
        params: { id: modality.value.id },
    })
}

onMounted(fetchData)
</script>
