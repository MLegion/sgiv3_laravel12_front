<template>
    <div class="max-w-md space-y-6">
        <h1 class="text-xl font-semibold text-slate-800">
            ELIMINAR - TIPO DE MODADLIDAD
        </h1>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <p class="text-sm text-slate-600">
                ¿ESTAS SEGURO DE ELIMINAR EL TIPO DE MODADLIDAD <strong>{{ name }}</strong>?
            </p>

            <p class="text-xs text-red-600">
                ESTA ACCIÓN NO SE PUEDE DESHACER.
            </p>

            <div class="flex justify-end gap-2">
                <button
                    class="px-4 py-2 text-sm border rounded-lg"
                    @click="goBack"
                >
                    CANCELAR
                </button>

                <button
                    class="px-4 py-2 text-sm rounded-lg
                           bg-red-600 text-white hover:bg-red-700
                           disabled:opacity-60"
                    :disabled="loading"
                    @click="remove"
                >
                    ELIMINAR
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

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const name = ref('')

async function fetchName() {
    const { data } = await api.get(
        API.SUPERADMIN_API.modalityTypes.byId(route.params.id)
    )
    name.value = data.name
}

async function remove() {
    loading.value = true
    try {
        await api.delete(
            API.SUPERADMIN_API.modalityTypes.delete(route.params.id)
        )
        router.push({ name: 'superadmin.modalitytypes' })
    } finally {
        loading.value = false
    }
}

function goBack() {
    router.back()
}

onMounted(fetchName)
</script>
