<template>
    <div class="space-y-4">
        <div class="flex items-baseline justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Aspirantes no admitidos</h1>
            <div class="text-xs text-slate-500" v-if="data?.period">
                Periodo: <span class="font-semibold text-slate-700">{{ data.period.name }}</span>
            </div>
        </div>

        <!-- Selector de periodo -->
        <div class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
            <label for="nar-period-id" class="text-xs font-semibold text-slate-600 uppercase">Periodo</label>
            <select
                id="nar-period-id"
                v-model="periodId"
                class="border-2 border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-rose-500"
                @change="reload"
            >
                <option v-if="periodsLoading" :value="null">Cargando…</option>
                <option :value="null">— Default (configurado en Admisión) —</option>
                <option v-for="p in periodsList" :key="p.id" :value="p.id">
                    {{ p.name }}
                </option>
            </select>

            <span v-if="data?.canChooseScope" class="w-full sm:w-auto sm:ml-auto inline-flex items-center gap-2">
                <span class="text-xs text-slate-500">Vista:</span>
                <button
                    v-for="opt in ['campus','career']"
                    :key="opt"
                    :class="['px-2.5 py-1 text-xs font-semibold rounded',
                        scope === opt ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
                    @click="scope = opt as 'campus'|'career'; reload()"
                >
                    {{ opt === 'campus' ? 'Campus' : 'Mis carreras' }}
                </button>
            </span>
        </div>

        <template v-if="loading">
            <div class="bg-white border rounded-xl shadow-sm p-4">
                <SkeletonText :lines="5" />
            </div>
            <SkeletonTable :rows="5" :cols="6" />
        </template>

        <template v-else-if="data">
            <!-- Resumen por razón -->
            <div class="bg-white border rounded-xl shadow-sm p-4">
                <div class="flex items-baseline justify-between mb-3">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Desglose por razón</h2>
                    <div class="text-2xl font-bold text-rose-600">{{ data.total }}</div>
                </div>

                <div v-if="data.total === 0" class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                    Sin aspirantes no admitidos en este periodo.
                </div>

                <ul v-else class="space-y-2">
                    <li
                        v-for="r in reasonsSorted"
                        :key="r.key"
                        class="flex items-center gap-3"
                    >
                        <span class="text-xs font-medium text-slate-700 w-56 truncate">
                            {{ r.label }}
                        </span>
                        <div class="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                            <div
                                class="h-full rounded transition-all duration-300"
                                :class="r.color"
                                :style="{ width: r.pctMax + '%' }"
                            ></div>
                        </div>
                        <span class="text-xs font-mono font-bold text-slate-700 w-10 text-right">
                            {{ r.count }}
                        </span>
                        <span class="text-[10px] text-slate-500 w-12 text-right">
                            {{ r.pctTotal.toFixed(0) }}%
                        </span>
                    </li>
                </ul>
            </div>

            <!-- Sample (lista detallada) -->
            <div v-if="data.sample.length > 0" class="bg-white border rounded-xl shadow-sm p-4">
                <div class="flex items-baseline justify-between mb-3">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">
                        Muestra reciente ({{ data.sample.length }})
                    </h2>
                    <span class="text-[10px] text-slate-400 uppercase">los más recientes</span>
                </div>

                <DataTable
                    :columns="columns"
                    :rows="data.sample"
                    hide-search
                    caption="Aspirantes no admitidos"
                >
                    <template #cell-id="{ row }">
                        <span class="font-mono text-xs text-slate-400">{{ row.id }}</span>
                    </template>
                    <template #cell-name="{ row }">
                        <span class="font-medium text-slate-700">{{ row.name }}</span>
                    </template>
                    <template #cell-reason="{ row }">
                        <span class="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full"
                            :class="badgeColor(row.reason)">
                            {{ row.reasonLabel }}
                        </span>
                    </template>
                    <template #cell-offers="{ row }">
                        <ol v-if="row.offers.length" class="space-y-0.5 text-[11px] text-slate-600 list-decimal list-inside">
                            <li v-for="o in row.offers" :key="o.offerId" class="leading-tight">
                                <span class="font-medium text-slate-700">{{ o.careerShort ?? o.careerName ?? 'CARRERA?' }}</span>
                                <span class="text-slate-400"> · </span>
                                <span class="text-slate-600">{{ o.modalityTypeShort ?? o.modalityTypeName ?? 'MOD?' }}</span>
                                <span class="text-slate-400"> · </span>
                                <span class="text-slate-500">{{ o.campusShort ?? o.campusName ?? 'CAMPUS?' }}</span>
                            </li>
                        </ol>
                        <span v-else class="text-slate-300 text-xs">— sin opción elegida —</span>
                    </template>
                    <template #cell-note="{ row }">
                        <span v-if="row.note" :title="row.note" class="text-xs text-slate-600 line-clamp-2">{{ row.note }}</span>
                        <span v-else class="text-slate-300">—</span>
                    </template>
                    <template #cell-score="{ row }">
                        <span class="font-mono text-xs">{{ row.score !== null ? row.score.toFixed(2) : '—' }}</span>
                    </template>
                </DataTable>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import SkeletonText from '@/app/components/ui/SkeletonText.vue'
import SkeletonTable from '@/app/components/ui/SkeletonTable.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

interface Payload {
    period: { id: number; name: string; shortName: string | null } | null
    total: number
    byReason: Record<string, number>
    sample: Array<{
        id: number
        name: string
        reason: string
        reasonLabel: string
        score: number | null
        careerId: number | null
        note: string | null
        offers: Array<{
            offerId: number
            careerName: string | null
            careerShort: string | null
            modalityTypeName: string | null
            modalityTypeShort: string | null
            campusName: string | null
            campusShort: string | null
        }>
    }>
    reasonLabels: Record<string, string>
    currentScope: 'campus' | 'career'
    canChooseScope: boolean
    availablePeriods?: Array<{ id: number; name: string; shortName: string | null }>
}

type SampleRow = Payload['sample'][number]

const columns: DataTableColumn<SampleRow>[] = [
    { key: 'id', label: '#' },
    { key: 'name', label: 'Nombre' },
    { key: 'reason', label: 'Razón' },
    { key: 'offers', label: 'Ofertas elegidas' },
    { key: 'note', label: 'Nota' },
    { key: 'score', label: 'Puntaje', align: 'right' },
]

const data    = ref<Payload | null>(null)
const loading = ref(false)
const periodId = ref<number | null>(null)
const scope    = ref<'campus' | 'career'>('campus')
const periodsList = ref<Array<{ id: number; name: string }>>([])
const periodsLoading = ref(true)

const COLOR_BY_REASON: Record<string, string> = {
    cancelled:         'bg-slate-400',
    unverified:        'bg-amber-400',
    incomplete:        'bg-orange-400',
    no_show:           'bg-rose-400',
    score_with_result: 'bg-red-500',
    other:             'bg-slate-300',
}
const BADGE_BY_REASON: Record<string, string> = {
    cancelled:         'bg-slate-200 text-slate-700',
    unverified:        'bg-amber-100 text-amber-800',
    incomplete:        'bg-orange-100 text-orange-800',
    no_show:           'bg-rose-100 text-rose-800',
    score_with_result: 'bg-red-100 text-red-800',
    other:             'bg-slate-100 text-slate-700',
}
function badgeColor(reason: string) { return BADGE_BY_REASON[reason] ?? 'bg-slate-100 text-slate-700' }

const reasonsSorted = computed(() => {
    if (!data.value) return []
    const max = Math.max(1, ...Object.values(data.value.byReason))
    const total = Math.max(1, data.value.total)
    return Object.entries(data.value.byReason)
        .filter(([, c]) => c > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({
            key,
            count,
            label:    data.value!.reasonLabels[key] ?? key,
            pctMax:   Math.round((count / max) * 100),
            pctTotal: (count / total) * 100,
            color:    COLOR_BY_REASON[key] ?? 'bg-slate-300',
        }))
})

async function reload() {
    loading.value = true
    try {
        const params = new URLSearchParams()
        if (periodId.value) params.set('academic_period_id', String(periodId.value))
        if (scope.value !== 'campus') params.set('scope', scope.value)
        params.set('sample_limit', '50')
        const { data: payload } = await api.get<Payload>(API.ADMISSIONS_API.reports.nonAdmission(params.toString()))
        data.value = payload
    } finally {
        loading.value = false
    }
}

async function loadPeriods() {
    // Reusar el catalog del reporte de fichas (mismo endpoint expone availablePeriods).
    periodsLoading.value = true
    try {
        const { data: payload } = await api.get<{ availablePeriods: Array<{ id: number; name: string }> }>(
            API.ADMISSIONS_API.reports.fichas(''),
        )
        periodsList.value = payload.availablePeriods ?? []
    } catch { /* opcional */ } finally {
        periodsLoading.value = false
    }
}

onMounted(async () => {
    await Promise.all([reload(), loadPeriods()])
})
</script>
