<template>
    <div class="max-w-3xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">DETALLE - PERIODO INSTITUCIONAL</h1>
            <div class="flex gap-2">
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
                <button
                    class="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    :disabled="loading"
                    @click="router.push({ name: 'school-services.college-academic-periods.edit', params: { id: route.params.id } })"
                >
                    AJUSTAR
                </button>
            </div>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-8">
            <!-- Estado -->
            <section class="flex items-start gap-4">
                <div class="flex-1 space-y-1">
                    <template v-if="loading">
                        <Skeleton width="w-1/2" height="h-6" />
                        <Skeleton width="w-24" height="h-4" />
                    </template>
                    <template v-else>
                        <h2 class="text-lg font-semibold text-slate-800 uppercase">
                            {{ period.academicPeriod?.name ?? `Periodo #${period.id}` }}
                        </h2>
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-mono text-slate-400">ID: #{{ period.id }}</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="STATUS_CLASSES[period.status]">
                                {{ period.statusLabel }}
                            </span>
                        </div>
                    </template>
                </div>
            </section>

            <!-- Periodo Global -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">PERIODO GLOBAL ADOPTADO</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="NOMBRE"     :value="period.academicPeriod?.name"      :loading="loading" />
                    <InfoItem label="CLAVE"      :value="period.academicPeriod?.shortName" :loading="loading" />
                    <InfoItem label="INICIO SUG." :value="formatDate(period.academicPeriod?.suggestedStartDate)" :loading="loading" />
                    <InfoItem label="FIN SUG."    :value="formatDate(period.academicPeriod?.suggestedEndDate)"   :loading="loading" />
                </div>
            </section>

            <!-- Fechas reales -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest text-blue-600">FECHAS INSTITUCIONALES</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="INICIO REAL" :value="formatDate(period.actualStartDate)" :loading="loading" />
                    <InfoItem label="FIN REAL"    :value="formatDate(period.actualEndDate)"   :loading="loading" />
                </div>
            </section>

            <!-- Metadatos -->
            <section class="pt-4 border-t">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="CREADO"      :value="formatDate(period.createdAt)" :loading="loading" />
                    <InfoItem label="ACTUALIZADO" :value="formatDate(period.updatedAt)" :loading="loading" />
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import InfoItem from '@/app/components/ui/InfoItem.vue'
import Skeleton from '@/app/components/ui/Skeleton.vue'
import type { CollegeAcademicPeriod } from '@/modules/school-services/types/college-academic-period.type'
import { STATUS_CLASSES } from '@/modules/school-services/types/college-academic-period.type'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const period = ref<CollegeAcademicPeriod>({} as CollegeAcademicPeriod)

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.byId(route.params.id))
        period.value = data
    } finally {
        setTimeout(() => { loading.value = false }, 300)
    }
}

function formatDate(value?: string | null) {
    if (!value) return null
    try {
        return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
    } catch { return value }
}

onMounted(fetchData)
</script>
