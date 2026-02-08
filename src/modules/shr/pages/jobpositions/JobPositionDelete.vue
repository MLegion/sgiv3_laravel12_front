<template>
    <div class="max-w-4xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-red-700">
                Eliminar puesto
            </h1>

            <button
                type="button"
                class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100"
                @click="goBack"
            >
                Cancelar
            </button>
        </div>

        <!-- Card -->
        <div
            class="bg-white border border-red-200 rounded-xl shadow-sm p-6
                   space-y-6 relative"
        >
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

            <!-- Información del puesto -->
            <section class="space-y-2">
                <h3 class="text-sm font-semibold text-slate-600">
                    Información del puesto
                </h3>

                <div class="border rounded-lg p-4 bg-slate-50">
                    <p class="text-sm">
                        <span class="font-medium text-slate-700">
                            Nombre:
                        </span>
                        {{ jobPosition.name }}
                    </p>

                    <p class="text-sm mt-1">
                        <span class="font-medium text-slate-700">
                            Estado:
                        </span>
                        <span
                            :class="jobPosition.status
                                ? 'text-green-700'
                                : 'text-red-700'"
                        >
                            {{ jobPosition.status ? 'Activo' : 'Inactivo' }}
                        </span>
                    </p>

                    <p
                        v-if="jobPosition.description"
                        class="text-sm mt-1 text-slate-600"
                    >
                        {{ jobPosition.description }}
                    </p>
                </div>
            </section>

            <!-- Error backend -->
            <p
                v-if="serverError"
                class="text-sm text-red-600"
            >
                {{ serverError }}
            </p>

            <!-- Advertencia -->
            <div
                class="flex items-start gap-3 p-4 rounded-lg
                       bg-red-50 border border-red-200"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6 text-red-600 mt-0.5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 9v3.75m0 3h.008M4.697 19.263
                           c-.867 1.5.217 3.237 1.948 3.237h10.71
                           c1.73 0 2.815-1.737 1.948-3.237L13.948
                           3.737c-.866-1.5-3.032-1.5-3.898 0L4.697 19.263z"
                    />
                </svg>

                <div>
                    <p class="text-sm font-medium text-red-700">
                        Acción irreversible
                    </p>
                    <p class="text-sm text-red-600 mt-1">
                        Estás a punto de eliminar este puesto.
                        Esta acción no se puede deshacer.
                    </p>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-2">
                <button
                    type="button"
                    class="px-4 py-2 text-sm border rounded-lg
                           hover:bg-slate-100"
                    @click="goBack"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    class="px-4 py-2 text-sm rounded-lg
                           bg-red-600 text-white hover:bg-red-700
                           disabled:opacity-60"
                    :disabled="deleting"
                    @click="confirmDelete"
                >
                    Eliminar
                </button>
            </div>
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
const deleting = ref(false)
const serverError = ref<string | null>(null)

const jobPosition = ref<{
    id: number
    name: string
    description?: string
    status: boolean
}>({
    id: 0,
    name: '',
    status: true,
})

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
/* DELETE */
/* -------------------------------------------------------------------------- */
async function confirmDelete() {
    serverError.value = null
    deleting.value = true

    try {
        await api.delete(
            API.SHR_API.jobPosition.delete(route.params.id)
        )

        router.push({
            name: 'shr.humanresources.jobpositions',
        })
    } catch (e: any) {
        serverError.value =
            e?.response?.data?.message ??
            'No se pudo eliminar el puesto.'
    } finally {
        deleting.value = false
    }
}

function goBack() {
    router.back()
}

onMounted(fetchJobPosition)
</script>
