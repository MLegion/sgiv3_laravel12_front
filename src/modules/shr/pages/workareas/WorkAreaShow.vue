<template>
    <div class="max-w-5xl space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Información del área de trabajo
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
                class="absolute inset-0 bg-white/80 z-10 p-6 space-y-8"
                role="status"
            >
                <span class="sr-only">Cargando información…</span>

                <!-- Encabezado -->
                <div class="space-y-2">
                    <div class="h-5 w-56 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                    <div class="h-2.5 w-20 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                </div>

                <!-- Información general -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div v-for="i in 3" :key="i" class="space-y-2">
                        <div class="h-2.5 w-20 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                        <div class="h-4 w-full rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                    </div>
                </div>
            </div>

            <!-- Header info -->
            <section>
                <h2 class="text-lg font-semibold text-slate-800">
                    {{ workArea.name }}
                </h2>

                <p class="text-xs text-slate-400 mt-1">
                    ID #{{ workArea.id }}
                </p>
            </section>

            <!-- Información general -->
            <section>
                <h3 class="text-sm font-semibold text-slate-600 mb-4">
                    INFORMACIÓN GENERAL
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoItem
                        label="Nombre"
                        :value="workArea.name"
                    />

                    <InfoItem
                        label="Descripción"
                        :value="workArea.description || '—'"
                    />

                    <InfoItem label="Estado">
                        <span
                            class="inline-flex px-2 py-1 text-xs rounded-full"
                            :class="workArea.status
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'"
                        >
                            {{ workArea.status ? 'ACTIVO' : 'INACTIVO' }}
                        </span>
                    </InfoItem>
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
/* ROUTER */
/* -------------------------------------------------------------------------- */
const route = useRoute()
const router = useRouter()

/* -------------------------------------------------------------------------- */
/* STATE */
/* -------------------------------------------------------------------------- */
const loading = ref(true)
const workArea = ref<{
    id: number
    name: string
    description?: string | null
    status: boolean
}>({
    id: 0,
    name: '',
    description: null,
    status: true,
})

/* -------------------------------------------------------------------------- */
/* FETCH */
/* -------------------------------------------------------------------------- */
async function fetchWorkArea() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SHR_API.workArea.byId(route.params.id)
        )

        workArea.value = data
    } finally {
        loading.value = false
    }
}

onMounted(fetchWorkArea)

/* -------------------------------------------------------------------------- */
/* ACTIONS */
/* -------------------------------------------------------------------------- */
function goBack() {
    router.back()
}

function goToEdit() {
    router.push({
        name: 'shr.humanresources.workareas.edit',
        params: { id: workArea.value.id },
    })
}
</script>
