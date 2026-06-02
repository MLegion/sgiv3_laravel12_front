<template>
    <WidgetPeriodSettings
        v-if="view === 'settings'"
        :periods="data?.availablePeriods ?? []"
        @params="$emit('params', $event)"
    />

    <div v-else class="h-full flex flex-col text-xs">
        <div v-if="loading && !data" class="flex-1 grid place-items-center text-slate-400">Cargando…</div>
        <div v-else-if="error" class="flex-1 grid place-items-center text-rose-500">Error al cargar.</div>
        <div v-else-if="!data || data.total === 0" class="flex-1 grid place-items-center text-slate-400 text-center px-4">
            Sin asignaciones a examen presencial.
        </div>

        <template v-else>
            <div class="flex items-baseline gap-1.5 mb-3">
                <span class="text-2xl font-bold text-slate-800 tabular-nums">{{ data.total }}</span>
                <span class="text-slate-500">asignaciones</span>
            </div>
            <div class="flex-1 min-h-0 overflow-auto">
                <WidgetBars :items="buckets" :max="data.total" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WidgetPeriodSettings from './_shared/WidgetPeriodSettings.vue'
import WidgetBars from './_shared/WidgetBars.vue'

interface Bucket { key: string; label: string; count: number; percentage: number }
interface Period { id: number; name: string; shortName: string | null }
interface Payload { buckets: Bucket[]; total: number; availablePeriods: Period[] }

const props = defineProps<{ data: Payload | null; loading: boolean; error: unknown; view?: 'data' | 'settings' }>()
defineEmits<{ (e: 'params', p: Record<string, unknown>): void }>()

const COLOR: Record<string, string> = {
    PRESENT: 'bg-emerald-500', ABSENT: 'bg-rose-500', INCOMPLETE: 'bg-amber-500', PENDING: 'bg-slate-400',
}
const buckets = computed(() => (props.data?.buckets ?? []).map(b => ({
    key: b.key, label: b.label, count: b.count, sub: `${b.percentage.toFixed(0)}%`, color: COLOR[b.key] ?? 'bg-slate-400',
})))
</script>
