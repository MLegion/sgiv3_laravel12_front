<template>
    <section class="px-4 py-3 space-y-3 max-w-6xl mx-auto">
        <header class="flex items-center gap-3">
            <h1 class="text-lg font-semibold text-slate-800">Cierre de periodo escolar</h1>
            <button
                class="ml-auto text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                :disabled="loading"
                @click="load"
            >Recargar</button>
        </header>

        <p class="text-sm text-slate-600">
            Listado de periodos de tu plantel con el progreso de cierre.
            Cada periodo se cierra cuando todas las actas docentes están cerradas y la cobertura de calificaciones es 100%.
        </p>

        <div
            v-if="errorMsg"
            role="alert"
            class="flex items-center gap-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2"
        >
            <span class="flex-1">{{ errorMsg }}</span>
            <button
                class="text-xs px-2 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold"
                :disabled="loading"
                @click="load"
            >Reintentar</button>
        </div>

        <SkeletonTable v-if="loading && items.length === 0" :rows="5" :cols="7" />
        <div v-else-if="!errorMsg && items.length === 0" class="text-sm text-slate-500 italic">No hay periodos.</div>

        <DataTable v-else :columns="columns" :rows="items" hide-search caption="Cierre de periodos" empty-text="No hay periodos.">
            <template #cell-period="{ row: it }">
                <span class="font-medium">{{ it.periodShortName ?? it.periodName }}</span>
            </template>
            <template #cell-status="{ row: it }">
                <span
                    class="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded font-mono"
                    :class="statusBadgeClass(it.status)"
                >{{ it.status }}</span>
            </template>
            <template #cell-dates="{ row: it }">
                <span class="text-slate-500">{{ it.startDate }} → {{ it.endDate }}</span>
            </template>
            <template #cell-coverage="{ row: it }">
                <span :class="coverageColor(it.coveragePct)">{{ it.coveragePct }}%</span>
            </template>
            <template #cell-actas="{ row: it }">
                <span class="text-emerald-700">{{ it.closedActasCount }}</span>
                <span class="text-slate-400 mx-0.5">/</span>
                <span :class="it.openActasCount > 0 ? 'text-amber-600' : 'text-slate-400'">
                    {{ it.closedActasCount + it.openActasCount }}
                </span>
            </template>
            <template #cell-gradesLoaded="{ row: it }">
                <span v-if="it.gradesLoadedAt" class="text-emerald-700">
                    ✓ {{ formatDate(it.gradesLoadedAt) }}
                </span>
                <span v-else class="text-slate-400 italic">pendiente</span>
            </template>
            <template #cell-actions="{ row: it }">
                <RouterLink
                    :to="`/school-services/period-closure/${it.collegeAcademicPeriodId}`"
                    class="text-[11px] px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                >Detalle →</RouterLink>
            </template>
        </DataTable>
    </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import SkeletonTable from '@/app/components/ui/SkeletonTable.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

interface SummaryItem {
    collegeAcademicPeriodId: number
    academicPeriodId:        number
    periodName:              string
    periodShortName:         string | null
    status:                  string
    startDate:               string
    endDate:                 string
    gradesLoadedAt:          string | null
    enrolledCount:           number
    gradedCount:             number
    coveragePct:             number
    closedActasCount:        number
    openActasCount:          number
}

const loading  = ref(false)
const items    = ref<SummaryItem[]>([])
const errorMsg = ref('')
const columns: DataTableColumn<SummaryItem>[] = [
    { key: 'period', label: 'Periodo' },
    { key: 'status', label: 'Estado' },
    { key: 'dates', label: 'Fechas' },
    { key: 'coverage', label: 'Cobertura', align: 'right' },
    { key: 'actas', label: 'Actas', align: 'right' },
    { key: 'gradesLoaded', label: 'Carga cerrada' },
    { key: 'actions', label: '', align: 'right' },
]

async function load(): Promise<void> {
    loading.value = true
    errorMsg.value = ''
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.periodClosure.summary)
        items.value = data.items ?? []
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message ?? 'No se pudieron cargar los periodos.'
    } finally {
        loading.value = false
    }
}

function statusBadgeClass(status: string): string {
    return {
        draft:    'bg-amber-100 text-amber-700',
        planned:  'bg-blue-100 text-blue-700',
        active:   'bg-emerald-100 text-emerald-700',
        closed:   'bg-slate-200 text-slate-700',
        archived: 'bg-slate-100 text-slate-500',
    }[status] ?? 'bg-slate-100 text-slate-600'
}

function coverageColor(pct: number): string {
    if (pct === 100) return 'text-emerald-700 font-semibold'
    if (pct >= 80) return 'text-amber-600 font-semibold'
    return 'text-rose-600 font-semibold'
}

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' })
    } catch {
        return iso
    }
}

onMounted(load)
</script>
