<template>
    <!-- MODO SETTINGS -->
    <div v-if="view === 'settings'" class="space-y-3 text-xs">
        <div>
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Periodo actual
            </label>
            <select
                v-model="periodChoice"
                class="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5"
                @change="emitParams"
            >
                <option value="">{{ data?.currentPeriod?.shortName ? `(auto: ${data.currentPeriod.shortName})` : '(actual auto)' }}</option>
                <option v-for="p in (data?.availablePeriods ?? [])" :key="p.id" :value="String(p.id)">
                    {{ p.shortName ?? p.name }}
                </option>
            </select>
        </div>

        <div>
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Comparar con
            </label>
            <select
                v-model="compareWith"
                class="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5"
                @change="emitParams"
            >
                <option value="">{{ data?.comparePeriod?.shortName ? `(auto: ${data.comparePeriod.shortName})` : '(año-1 auto)' }}</option>
                <option v-for="p in (data?.availablePeriods ?? [])" :key="p.id" :value="String(p.id)">
                    {{ p.shortName ?? p.name }}
                </option>
            </select>
        </div>

        <div v-if="data?.canChooseScope">
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Vista
            </label>
            <div class="inline-flex bg-slate-100 rounded-lg p-0.5 w-full">
                <button class="flex-1 px-2 py-1 text-xs rounded-md transition"
                        :class="scopeChoice === 'campus' ? activeBtn : inactiveBtn"
                        @click="setScope('campus')">Campus</button>
                <button class="flex-1 px-2 py-1 text-xs rounded-md transition"
                        :class="scopeChoice === 'career' ? activeBtn : inactiveBtn"
                        @click="setScope('career')">Mi carrera</button>
            </div>
        </div>
    </div>

    <div v-else-if="!data" class="text-xs text-slate-400 italic">
        {{ loading ? 'Cargando…' : 'Sin datos.' }}
    </div>

    <div v-else class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-xs text-slate-500">
                <span class="font-medium text-slate-700">{{ data.currentPeriod?.shortName ?? '—' }}</span>
                <span class="mx-1">vs</span>
                <span>{{ data.comparePeriod?.shortName ?? '— sin comparativo' }}</span>
            </div>

            <div class="inline-flex bg-slate-100 rounded-lg p-0.5">
                <button
                    class="px-3 py-1 text-xs rounded-md transition"
                    :class="tableOrChart === 'table' ? activeBtn : inactiveBtn"
                    @click="tableOrChart = 'table'"
                >
                    Tabla
                </button>
                <button
                    class="px-3 py-1 text-xs rounded-md transition"
                    :class="tableOrChart === 'chart' ? activeBtn : inactiveBtn"
                    @click="tableOrChart = 'chart'"
                >
                    Gráfico
                </button>
            </div>
        </div>

        <!-- TABLA -->
        <div v-if="tableOrChart === 'table'" class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
                <thead>
                    <tr>
                        <th scope="col" rowspan="2" class="border border-slate-300 bg-slate-100 px-2 py-1 text-left">#</th>
                        <th scope="col" rowspan="2" class="border border-slate-300 bg-slate-100 px-2 py-1 text-left">CARRERA</th>
                        <template v-for="m in data.modalities" :key="m.id">
                            <th scope="col" colspan="2" class="border border-slate-300 bg-slate-100 px-2 py-1 text-center uppercase">
                                {{ (m.shortName ?? m.name) }} {{ currentYear }}
                            </th>
                        </template>
                    </tr>
                    <tr>
                        <template v-for="m in data.modalities" :key="`sub-${m.id}`">
                            <th scope="col" class="border border-slate-300 bg-slate-50 px-2 py-1 text-center font-medium">FICHAS</th>
                            <th scope="col" class="border border-slate-300 bg-slate-50 px-2 py-1 text-center font-medium text-slate-500">
                                FICHAS {{ compareYear ?? '—' }}
                            </th>
                        </template>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(c, idx) in data.careers" :key="c.id" class="hover:bg-slate-50">
                        <td class="border border-slate-300 bg-slate-50 px-2 py-1 text-center text-slate-500">{{ idx + 1 }}</td>
                        <td class="border border-slate-300 px-2 py-1 truncate max-w-xs" :title="c.name">
                            {{ c.name }}
                        </td>
                        <template v-for="m in data.modalities" :key="`${c.id}-${m.id}`">
                            <template v-if="cellMap[`${c.id}:${m.id}`]?.available">
                                <td class="border border-slate-300 px-2 py-1 text-center font-semibold">
                                    {{ formatNum(cellMap[`${c.id}:${m.id}`].current) }}
                                </td>
                                <td class="border border-slate-300 px-2 py-1 text-center text-slate-500">
                                    {{ formatNum(cellMap[`${c.id}:${m.id}`].compare) }}
                                </td>
                            </template>
                            <template v-else>
                                <td class="border border-slate-300 bg-amber-300/70" colspan="2">&nbsp;</td>
                            </template>
                        </template>
                    </tr>

                    <!-- TOTAL por modalidad -->
                    <tr class="font-semibold">
                        <td class="border border-slate-300 bg-slate-100" colspan="2">
                            <div class="px-2 py-1 text-right">TOTAL</div>
                        </td>
                        <template v-for="m in data.modalities" :key="`tot-${m.id}`">
                            <td class="border border-slate-300 bg-slate-100 px-2 py-1 text-center">
                                {{ formatNum(totalsMap[m.id]?.current ?? 0) }}
                            </td>
                            <td class="border border-slate-300 bg-slate-100 px-2 py-1 text-center text-slate-600">
                                {{ formatNum(totalsMap[m.id]?.compare ?? 0) }}
                            </td>
                        </template>
                    </tr>
                </tbody>
            </table>

            <!-- TOTAL global -->
            <div class="mt-3 flex justify-end gap-6 text-xs">
                <div class="text-right">
                    <div class="text-slate-500 uppercase tracking-wide">Total {{ currentYear ?? '—' }}</div>
                    <div class="text-base font-semibold text-slate-800">{{ formatNum(data.grandTotal.current) }}</div>
                </div>
                <div class="text-right">
                    <div class="text-slate-500 uppercase tracking-wide">Total {{ compareYear ?? '—' }}</div>
                    <div class="text-base font-semibold text-slate-500">{{ formatNum(data.grandTotal.compare) }}</div>
                </div>
            </div>
        </div>

        <!-- CHART -->
        <div v-else class="h-72">
            <Bar :data="chartData" :options="chartOptions" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

interface PeriodRef    { id: number; name: string; shortName: string | null }
interface Career       { id: number; name: string; shortName: string | null }
interface Modality     { id: number; name: string; shortName: string | null }
interface Cell         { careerId: number; modalityId: number; available: boolean; current: number; compare: number }
interface ModalityTot  { modalityId: number; current: number; compare: number }
interface Payload {
    currentPeriod:    PeriodRef | null
    comparePeriod:    PeriodRef | null
    modalities:       Modality[]
    careers:          Career[]
    cells:            Cell[]
    totalsByModality: ModalityTot[]
    grandTotal:       { current: number; compare: number }
    availablePeriods?: PeriodRef[]
    currentScope?:    'campus' | 'career'
    canChooseScope?:  boolean
}

const props = defineProps<{
    data:    Payload | null
    loading: boolean
    // 'data' | 'settings' (inyectado por WidgetCard; en la página queda undefined)
    view?:   'data' | 'settings'
}>()

const emit = defineEmits<{
    (e: 'params', p: Record<string, string | number | null>): void
}>()

// Toggle interno tabla/gráfico (siempre visible en modo data).
const tableOrChart = ref<'table' | 'chart'>('table')

// Estado de settings (modo settings).
const periodChoice = ref<string>('')
const compareWith  = ref<string>('')
const scopeChoice  = ref<'campus' | 'career'>('campus')

watch(() => props.data?.currentScope, (s) => {
    if (s) scopeChoice.value = s
}, { immediate: true })

function emitParams(): void {
    emit('params', {
        academic_period_id: periodChoice.value,
        compare_with:       compareWith.value,
        scope:              props.data?.canChooseScope ? scopeChoice.value : null,
    })
}

function setScope(s: 'campus' | 'career'): void {
    scopeChoice.value = s
    emitParams()
}

const activeBtn   = 'bg-white shadow text-slate-800'
const inactiveBtn = 'text-slate-500 hover:text-slate-700'

const cellMap = computed<Record<string, Cell>>(() => {
    const map: Record<string, Cell> = {}
    for (const c of props.data?.cells ?? []) map[`${c.careerId}:${c.modalityId}`] = c
    return map
})

const totalsMap = computed<Record<number, ModalityTot>>(() => {
    const map: Record<number, ModalityTot> = {}
    for (const t of props.data?.totalsByModality ?? []) map[t.modalityId] = t
    return map
})

const currentYear = computed(() => extractYear(props.data?.currentPeriod?.shortName))
const compareYear = computed(() => extractYear(props.data?.comparePeriod?.shortName))

function extractYear(s: string | null | undefined): string | null {
    if (!s) return null
    const m = s.match(/(\d{4})/)
    return m ? m[1] : null
}

function formatNum(n: number): string {
    return (n ?? 0).toLocaleString('es-MX')
}

// Chart: una serie por modalidad, valores del periodo actual.
const palette = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2']

const chartData = computed(() => {
    const careers   = props.data?.careers ?? []
    const modalities = props.data?.modalities ?? []
    return {
        labels: careers.map(c => c.shortName || shortenName(c.name)),
        datasets: modalities.map((m, i) => ({
            label: m.shortName ?? m.name,
            backgroundColor: palette[i % palette.length],
            data: careers.map(c => {
                const cell = cellMap.value[`${c.id}:${m.id}`]
                return cell?.available ? cell.current : 0
            }),
        })),
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'top' as const },
        tooltip: {
            callbacks: {
                title: (items: any) => items?.[0]?.label ?? '',
            },
        },
    },
    scales: {
        x: { ticks: { autoSkip: false, maxRotation: 60, minRotation: 30, font: { size: 10 } } },
        y: { beginAtZero: true, ticks: { precision: 0 } },
    },
}

function shortenName(name: string): string {
    return name
        .replace(/^INGENIERÍA EN\s+/i, 'ING. ')
        .replace(/^INGENIERÍA\s+/i, 'ING. ')
        .replace(/^CONTADOR\s+/i, 'CONT. ')
}
</script>
