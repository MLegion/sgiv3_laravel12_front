<template>
    <div class="max-w-lg space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Eliminar Escuela de Procedencia</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl p-6 text-center text-slate-400 text-sm">Cargando...</div>

        <template v-else-if="school">
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                <p class="text-sm text-slate-600">
                    ¿Estás seguro de que deseas eliminar la siguiente escuela de procedencia?
                </p>
                <div class="bg-slate-50 border rounded-lg p-4 text-sm space-y-1">
                    <p class="font-semibold text-slate-800">{{ school.name }}</p>
                    <p v-if="school.shortName" class="text-slate-500">{{ school.shortName }}</p>
                    <p v-if="school.cct" class="text-slate-500 font-mono">CCT: {{ school.cct }}</p>
                </div>

                <p class="text-xs text-red-600">Esta acción no se puede deshacer.</p>

                <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

                <div class="flex justify-end gap-2 pt-2 border-t">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">
                        CANCELAR
                    </button>
                    <button
                        type="button"
                        class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                        :disabled="submitting"
                        @click="confirm"
                    >
                        {{ submitting ? 'ELIMINANDO...' : 'ELIMINAR' }}
                    </button>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { OriginSchoolType } from '@/modules/admissions/types/origin-school.type'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const school = ref<OriginSchoolType | null>(null)

async function fetchSchool() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.originSchools.byId(route.params.id as string))
        school.value = data
    } finally {
        loading.value = false
    }
}

async function confirm() {
    error.value = null
    submitting.value = true
    try {
        await api.delete(API.ADMISSIONS_API.originSchools.delete(route.params.id as string))
        router.push({ name: 'admissions.origin-schools' })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al eliminar.'
    } finally {
        submitting.value = false
    }
}

onMounted(fetchSchool)
</script>
