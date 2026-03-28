<template>
    <div class="max-w-3xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">DETALLE - PERIODO ACADÉMICO</h1>
            <div class="flex gap-2">
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">
                    VOLVER
                </button>
                <button
                    class="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    :disabled="loading"
                    @click="router.push({ name: 'superadmin.academic-periods.edit', params: { id: route.params.id } })"
                >
                    EDITAR
                </button>
            </div>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-8">
            <!-- Header -->
            <section class="flex items-start gap-4">
                <div class="flex-1 space-y-1">
                    <template v-if="loading">
                        <Skeleton width="w-1/2" height="h-6" />
                        <Skeleton width="w-24" height="h-4" />
                    </template>
                    <template v-else>
                        <h2 class="text-lg font-semibold text-slate-800 uppercase">{{ period.name }}</h2>
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-mono text-slate-400">ID: #{{ period.id }}</span>
                            <span
                                class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                :class="STATUS_CLASSES[period.status]"
                            >
                                {{ period.statusLabel }}
                            </span>
                        </div>
                    </template>
                </div>
            </section>

            <!-- Identificación -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">IDENTIFICACIÓN</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="NOMBRE" :value="period.name" :loading="loading" />
                    <InfoItem label="CLAVE CORTA" :value="period.shortName" :loading="loading" />
                </div>
            </section>

            <!-- Fechas sugeridas -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">FECHAS SUGERIDAS</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="INICIO SUGERIDO" :value="formatDate(period.suggestedStartDate)" :loading="loading" />
                    <InfoItem label="FIN SUGERIDO"    :value="formatDate(period.suggestedEndDate)"   :loading="loading" />
                </div>
            </section>

            <!-- Periodo anterior -->
            <section v-if="loading || period.previousPeriodId">
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">CONTINUIDAD</h3>
                <InfoItem label="PERIODO ANTERIOR" :value="previousName" :loading="loading" />
            </section>

            <!-- Metadatos -->
            <section class="pt-4 border-t">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="CREADO"     :value="formatDate(period.createdAt)" :loading="loading" />
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
import type { AcademicPeriod } from '@/modules/superadmin/types/academic-period.type'
import { ACADEMIC_PERIOD_STATUS_CLASSES as STATUS_CLASSES } from '@/modules/superadmin/types/academic-period.type'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const period = ref<AcademicPeriod>({} as AcademicPeriod)
const previousName = ref<string | null>(null)

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(API.SUPERADMIN_API.academicPeriods.byId(route.params.id))
        period.value = data

        if (data.previousPeriodId) {
            const { data: prev } = await api.get(API.SUPERADMIN_API.academicPeriods.byId(data.previousPeriodId))
            previousName.value = `${prev.name} (${prev.shortName})`
        }
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
