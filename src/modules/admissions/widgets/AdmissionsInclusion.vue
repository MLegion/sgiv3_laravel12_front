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
            Sin aspirantes en este periodo.
        </div>

        <template v-else>
            <p class="text-[10px] text-slate-400 mb-2">
                Sobre <span class="font-semibold text-slate-600">{{ data.total }}</span> aspirantes (barra = % que sí aplica).
            </p>
            <div class="flex-1 min-h-0 overflow-auto">
                <WidgetBars :items="categories" :max="100" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WidgetPeriodSettings from './_shared/WidgetPeriodSettings.vue'
import WidgetBars from './_shared/WidgetBars.vue'

interface CategoryStats { withCount: number; withoutCount: number; percentage: number }
interface Period { id: number; name: string; shortName: string | null }
interface Payload {
    total: number
    disability: CategoryStats
    indigenousGroup: CategoryStats
    indigenousLanguage: CategoryStats
    scholarship: CategoryStats
    availablePeriods: Period[]
}

const props = defineProps<{ data: Payload | null; loading: boolean; error: unknown; view?: 'data' | 'settings' }>()
defineEmits<{ (e: 'params', p: Record<string, unknown>): void }>()

// Barra proporcional al porcentaje (max=100); sub muestra "N · pct%".
const categories = computed(() => {
    const d = props.data
    if (!d) return []
    const row = (label: string, c: CategoryStats, color: string) =>
        ({ label, count: Math.round(c.percentage), sub: `${c.withCount} · ${c.percentage.toFixed(0)}%`, color })
    return [
        row('Discapacidad',     d.disability,         'bg-rose-500'),
        row('Grupo indígena',   d.indigenousGroup,    'bg-amber-500'),
        row('Lengua indígena',  d.indigenousLanguage, 'bg-emerald-500'),
        row('Beca',             d.scholarship,        'bg-indigo-500'),
    ]
})
</script>
