<template>
    <div class="space-y-3">
        <div v-if="loading && !data" class="py-6 text-center text-sm text-slate-400">
            Cargando…
        </div>

        <template v-else-if="data">
            <div class="flex items-baseline justify-between">
                <div class="text-3xl font-bold text-rose-600">
                    {{ data.total }}
                </div>
                <div class="text-[10px] uppercase tracking-wider text-slate-400">
                    No admitidos {{ data.period?.shortName ?? '—' }}
                </div>
            </div>

            <div v-if="data.total === 0" class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                Sin no-admitidos en este periodo.
            </div>

            <ul v-else class="space-y-1.5">
                <li
                    v-for="r in nonZeroReasons"
                    :key="r.key"
                    class="flex items-center gap-2"
                >
                    <span class="text-[11px] font-medium text-slate-700 w-44 truncate" :title="r.label">
                        {{ r.label }}
                    </span>
                    <div class="flex-1 h-4 bg-slate-100 rounded overflow-hidden relative">
                        <div
                            class="h-full rounded transition-all duration-300"
                            :class="r.color"
                            :style="{ width: r.pct + '%' }"
                        ></div>
                    </div>
                    <span class="text-[11px] font-mono font-bold text-slate-700 w-10 text-right">
                        {{ r.count }}
                    </span>
                </li>
            </ul>

            <div class="pt-2 border-t border-slate-100">
                <router-link
                    to="/admissions/reports/non-admission"
                    class="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                >
                    Ver detalle →
                </router-link>
            </div>
        </template>

        <div v-else-if="error" class="text-xs text-red-600">
            Error al cargar el reporte.
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Contrato widget (mismo que ApplicantsPeriodCount, EnrollmentProgress, etc.):
// WidgetCard llama useWidgetData internamente y pasa data/loading/error/view.
interface Payload {
    period: { id: number; name: string; shortName: string | null } | null
    total: number
    byReason: Record<string, number>
    sample: unknown[]
    reasonLabels: Record<string, string>
}

const props = defineProps<{
    data:    Payload | null
    loading: boolean
    error:   unknown
    view?:   'data' | 'settings'
}>()

const COLOR_BY_REASON: Record<string, string> = {
    cancelled:            'bg-slate-400',
    unverified:           'bg-amber-400',
    incomplete:           'bg-orange-400',
    no_show:              'bg-rose-400',
    score_with_result:    'bg-red-500',
    score_low:            'bg-red-600',
    documents_incomplete: 'bg-orange-500',
    quota:                'bg-purple-500',
    policy:               'bg-indigo-500',
    other:                'bg-slate-500',
}

const nonZeroReasons = computed(() => {
    if (!props.data) return []
    const max = Math.max(1, ...Object.values(props.data.byReason))
    return Object.entries(props.data.byReason)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({
            key,
            count,
            label: props.data!.reasonLabels[key] ?? key,
            pct:   Math.round((count / max) * 100),
            color: COLOR_BY_REASON[key] ?? 'bg-slate-300',
        }))
})
</script>
