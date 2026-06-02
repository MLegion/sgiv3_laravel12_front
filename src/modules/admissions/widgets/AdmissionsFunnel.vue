<template>
    <!-- MODO SETTINGS -->
    <div v-if="view === 'settings'" class="h-full flex flex-col text-xs space-y-3">
        <div>
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Periodo
            </label>
            <select
                v-model="periodChoice"
                class="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
                @change="emitParams"
            >
                <option value="">Periodo vigente</option>
                <option
                    v-for="p in (data?.availablePeriods ?? [])"
                    :key="p.id"
                    :value="String(p.id)"
                >
                    {{ p.shortName ?? p.name }}
                </option>
            </select>
        </div>
        <div class="text-[10px] text-slate-400 mt-auto">
            Cambios aplican al cerrar la configuración.
        </div>
    </div>

    <!-- MODO DATA -->
    <div v-else class="h-full flex flex-col text-xs">
        <div v-if="loading && !data" class="flex-1 grid place-items-center text-slate-400">Cargando…</div>
        <div v-else-if="error" class="flex-1 grid place-items-center text-rose-500">Error al cargar.</div>

        <template v-else>
            <!-- Encabezado: total + periodo -->
            <div class="flex items-baseline justify-between mb-3">
                <div class="flex items-baseline gap-1.5">
                    <span class="text-2xl font-bold text-slate-800 tabular-nums">{{ data?.total ?? 0 }}</span>
                    <span class="text-slate-500">aspirantes</span>
                </div>
                <span class="text-[10px] text-slate-400 truncate" :title="data?.currentPeriod?.name ?? ''">
                    {{ data?.currentPeriod?.shortName ?? data?.currentPeriod?.name ?? '—' }}
                </span>
            </div>

            <!-- Embudo: una barra por etapa, ancho ∝ conteo -->
            <div v-if="(data?.total ?? 0) > 0" class="flex-1 flex flex-col justify-center gap-1.5">
                <div v-for="(s, i) in (data?.stages ?? [])" :key="s.key" class="group">
                    <div class="flex items-center justify-between text-[11px] mb-0.5">
                        <span class="font-medium text-slate-600">{{ s.label }}</span>
                        <span class="tabular-nums text-slate-500">
                            {{ s.count }}<span class="text-slate-400"> · {{ s.percentage.toFixed(0) }}%</span>
                        </span>
                    </div>
                    <div class="h-3 bg-slate-100 rounded">
                        <div
                            class="h-3 rounded transition-all duration-500"
                            :class="COLORS[i % COLORS.length]"
                            :style="{ width: barWidth(s.count) }"
                        />
                    </div>
                </div>
            </div>

            <div v-else class="flex-1 grid place-items-center text-slate-400 text-center px-4">
                Aún no hay aspirantes en este periodo.
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Contrato widget (igual que ApplicantsPeriodCount/EnrollmentProgress): WidgetCard
// llama useWidgetData y pasa data/loading/error/view, y escucha @params.
interface Stage { key: string; label: string; count: number; percentage: number }
interface Period { id: number; name: string; shortName: string | null }
interface Payload {
    stages: Stage[]
    total: number
    currentPeriod: Period | null
    availablePeriods: Period[]
}

const props = defineProps<{
    data:    Payload | null
    loading: boolean
    error:   unknown
    view?:   'data' | 'settings'
}>()

const emit = defineEmits<{ (e: 'params', payload: Record<string, unknown>): void }>()

const COLORS = [
    'bg-indigo-500', 'bg-purple-500', 'bg-blue-500',
    'bg-amber-500', 'bg-emerald-500', 'bg-teal-500',
]

// Ancho proporcional al total (la 1ª etapa = 100%), con un mínimo visible si >0.
const maxCount = computed(() => Math.max(1, props.data?.total ?? 1))
function barWidth(count: number): string {
    if (count <= 0) return '0%'
    return Math.max(3, Math.round((count / maxCount.value) * 100)) + '%'
}

const periodChoice = ref('')
watch(() => props.data?.currentPeriod?.id, () => { /* mantiene "vigente" salvo elección explícita */ })
function emitParams(): void {
    emit('params', { period_id: periodChoice.value })
}
</script>
