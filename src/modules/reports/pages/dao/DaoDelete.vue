<template>
    <div class="max-w-lg space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Eliminar DAO</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border border-red-200 rounded-xl shadow-sm p-6 space-y-4">
            <div v-if="loading" class="text-center text-slate-400 py-4">Cargando...</div>

            <template v-else-if="dao">
                <p class="text-sm text-slate-600">
                    ¿Estás seguro de que deseas eliminar el DAO
                    <strong class="text-slate-800">{{ dao.name }}</strong>?
                    Si está asociado a reportes, éstos dejarán de funcionar correctamente.
                </p>

                <div class="flex justify-end gap-2 pt-2">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">
                        CANCELAR
                    </button>
                    <button
                        type="button"
                        class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                        :disabled="submitting"
                        @click="confirmDelete"
                    >
                        {{ submitting ? 'ELIMINANDO...' : 'ELIMINAR' }}
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { DataAccessObject } from '@/modules/reports/types/dao.type'

const route  = useRoute()
const router = useRouter()
const loading = ref(true)
const submitting = ref(false)
const dao = ref<DataAccessObject | null>(null)

async function fetchDao() {
    loading.value = true
    try {
        const { data } = await api.get(API.REPORTS_API.daos.byId(route.params.id as string))
        dao.value = data
    } finally {
        loading.value = false
    }
}

async function confirmDelete() {
    submitting.value = true
    try {
        await api.delete(API.REPORTS_API.daos.delete(route.params.id as string))
        router.push({ name: 'reports.daos' })
    } finally {
        submitting.value = false
    }
}

onMounted(fetchDao)
</script>
