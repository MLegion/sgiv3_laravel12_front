<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Eliminar área de trabajo
            </h1>

            <button
                type="button"
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
                v-if="loading || submitting"
                class="absolute inset-0 bg-white/70 z-10
                       flex items-center justify-center"
            >
                <span class="text-sm text-slate-500">
                    {{ submitting ? 'Eliminando área…' : 'Cargando información…' }}
                </span>
            </div>

            <!-- Info -->
            <section class="space-y-3">
                <div>
                    <p class="text-xs font-medium text-slate-500">
                        Nombre del área
                    </p>
                    <p class="text-sm text-slate-800">
                        {{ workArea.name }}
                    </p>
                </div>

                <div>
                    <p class="text-xs font-medium text-slate-500">
                        Descripción
                    </p>
                    <p class="text-sm text-slate-800">
                        {{ workArea.description || '—' }}
                    </p>
                </div>

                <div>
                    <p class="text-xs font-medium text-slate-500">
                        Estado
                    </p>
                    <span
                        class="inline-flex px-2 py-1 text-xs rounded-full"
                        :class="workArea.status
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'"
                    >
                        {{ workArea.status ? 'Activo' : 'Inactivo' }}
                    </span>
                </div>
            </section>
            <!-- Warning -->
            <section class="flex items-start gap-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="text-red-600">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 9v3.75m0 3.75h.008M10.29 3.86l-7.4 12.8a1.5 1.5 0 001.3 2.24h15.62a1.5 1.5 0 001.3-2.24l-7.4-12.8a1.5 1.5 0 00-2.6 0z"
                        />
                    </svg>
                </div>

                <div>
                    <h2 class="text-sm font-semibold text-red-700">
                        Confirmación requerida
                    </h2>

                    <p class="text-sm text-red-600 mt-1">
                        Estás a punto de eliminar el área de trabajo.
                        Esta acción <strong>no se puede deshacer</strong>.
                    </p>
                </div>
            </section>

            <!-- Actions -->
            <section class="flex justify-end gap-2 border-t pt-6">
                <button
                    type="button"
                    class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-100"
                    :disabled="submitting"
                    @click="goBack"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    class="px-4 py-2 text-sm rounded-lg
                           bg-red-600 text-white hover:bg-red-700
                           disabled:opacity-60"
                    :disabled="submitting"
                    @click="confirmDelete"
                >
                    Eliminar área
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

const workArea = ref<{
    id: number
    name: string
    description: string | null
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

/* -------------------------------------------------------------------------- */
/* DELETE */
/* -------------------------------------------------------------------------- */
async function confirmDelete() {
    submitting.value = true
    try {
        await api.delete(
            API.SHR_API.workArea.delete(route.params.id)
        )

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

onMounted(fetchWorkArea)
</script>
