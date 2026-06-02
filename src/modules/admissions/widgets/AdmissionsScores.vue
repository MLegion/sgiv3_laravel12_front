<template>
    <WidgetPeriodSettings
        v-if="view === 'settings'"
        :periods="data?.availablePeriods ?? []"
        @params="$emit('params', $event)"
    />

    <div v-else class="h-full flex flex-col text-xs">
        <div v-if="loading && !data" class="flex-1 grid place-items-center text-slate-400">Cargando…</div>
        <div v-else-if="error" class="flex-1 grid place-items-center text-rose-500">Error al cargar.</div>
        <div v-else-if="!data || data.stats.count === 0" class="flex-1 grid place-items-center text-slate-400 text-center px-4">
            Sin calificaciones cargadas en este periodo.
        </div>

        <template v-else>
            <div class="grid grid-cols-5 gap-1 mb-3 text-center">
                <div v-for="m in metrics" :key="m.label" class="bg-slate-50 rounded py-1">
                    <div class="text-sm font-bold text-slate-800 tabular-nums">{{ m.value }}</div>
                    <div class="text-[9px] uppercase tracking-wide text-slate-400">{{ m.label }}</div>
                </div>
            </div>
            <div class="flex-1 min-h-0 overflow-auto">
                <WidgetBars :items="bins" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WidgetPeriodSettings from './_shared/WidgetPeriodSettings.vue'
import WidgetBars from './_shared/WidgetBars.vue'

interface Bin { label: string; count: number }
interface Stats { count: number; min: number | null; max: number | null; avg: number | null; median: number | null }
interface Period { id: number; name: string; shortName: string | null }
interface Payload { bins: Bin[]; stats: Stats; availablePeriods: Period[] }

const props = defineProps<{ data: Payload | null; loading: boolean; error: unknown; view?: 'data' | 'settings' }>()
defineEmits<{ (e: 'params', p: Record<string, unknown>): void }>()

const fmt = (n: number | null) => (n === null ? '—' : Number(n).toFixed(1))
const metrics = computed(() => [
    { label: 'Total',  value: props.data?.stats.count ?? 0 },
    { label: 'Mín',    value: fmt(props.data?.stats.min ?? null) },
    { label: 'Máx',    value: fmt(props.data?.stats.max ?? null) },
    { label: 'Prom',   value: fmt(props.data?.stats.avg ?? null) },
    { label: 'Med',    value: fmt(props.data?.stats.median ?? null) },
])
const bins = computed(() => (props.data?.bins ?? []).map(b => ({ label: b.label, count: b.count, color: 'bg-blue-500' })))
</script>
