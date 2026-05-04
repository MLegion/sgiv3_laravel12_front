<template>
    <div class="space-y-4">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis Sesiones de Examen</h1>

        <div v-if="loading" class="text-xs text-slate-400 italic py-8 text-center">Cargando...</div>

        <div v-else-if="!hasAny" class="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center space-y-2">
            <QrCodeIcon class="w-12 h-12 mx-auto text-slate-300" />
            <p class="text-sm text-slate-700 font-semibold uppercase">Sin sesiones asignadas</p>
            <p class="text-xs text-slate-500">No estás registrado como cuidador en ninguna sesión.</p>
        </div>

        <div v-else class="space-y-6">
            <SessionsBucket title="Hoy"        :sessions="data!.today"    accent="emerald" />
            <SessionsBucket title="Próximas"   :sessions="data!.upcoming" accent="blue" />
            <SessionsBucket title="Cerradas"   :sessions="data!.past"     accent="slate" />
        </div>

        <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { QrCodeIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import SessionsBucket from '@/modules/admissions/components/MyProctorSessionsBucket.vue'
import type { ProctorSessionsResponse } from '@/modules/admissions/types/exam-attendance.type'

const data    = ref<ProctorSessionsResponse | null>(null)
const loading = ref(true)
const error   = ref<string | null>(null)

const hasAny = computed(() => {
    if (!data.value) return false
    return data.value.today.length + data.value.upcoming.length + data.value.past.length > 0
})

async function load() {
    loading.value = true
    error.value   = null
    try {
        const res = await api.get<ProctorSessionsResponse>(API.ADMISSIONS_API.examAttendance.mySessions)
        data.value = res.data
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar las sesiones.'
    } finally {
        loading.value = false
    }
}

onMounted(load)
</script>
