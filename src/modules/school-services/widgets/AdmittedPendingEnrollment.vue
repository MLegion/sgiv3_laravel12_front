<template>
    <!-- MODO SETTINGS -->
    <div v-if="view === 'settings'" class="h-full flex flex-col text-xs space-y-3">
        <div>
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Periodo
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
        <div class="text-[10px] text-slate-400 mt-auto">
            Cambios aplican al cerrar la configuración.
        </div>
    </div>

    <!-- MODO DATA -->
    <div v-else class="h-full flex flex-col text-xs">
        <div class="text-slate-500 mb-2">
            <span class="font-medium text-slate-700">{{ data?.currentPeriod?.shortName ?? '—' }}</span>
        </div>

        <div v-if="loading && !data" class="text-slate-400 italic">Cargando…</div>

        <div v-else class="flex-1 flex flex-col">
            <div class="flex items-baseline gap-2 mt-1">
                <span class="text-4xl font-bold leading-none" :class="pending > 0 ? 'text-amber-600' : 'text-slate-400'">
                    {{ formatNum(pending) }}
                </span>
                <span class="text-[11px] uppercase tracking-wide text-slate-500">por inscribir</span>
            </div>

            <div class="text-[10px] text-slate-400 mt-1">
                {{ formatNum(inscritos) }} de {{ formatNum(admittedTotal) }} admitidos ya inscritos
            </div>

            <RouterLink
                v-if="pending > 0"
                to="/school-services/admitted-applicants/wizard"
                class="mt-auto inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
            >
                Inscribir ahora →
            </RouterLink>
            <div v-else class="mt-auto text-[11px] text-emerald-700 font-semibold uppercase">
                ✓ Sin pendientes
            </div>
        </div>

        <div v-if="error" class="mt-2 text-rose-600">No se pudo cargar.</div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

interface PeriodRef { id: number; name: string; shortName: string | null }
interface Payload {
    currentPeriod:    PeriodRef | null
    pending:          number
    inscritos:        number
    admittedTotal:    number
    availablePeriods: PeriodRef[]
}

const props = defineProps<{
    data:    Payload | null
    loading: boolean
    error:   unknown
    view?:   'data' | 'settings'
}>()

const emit = defineEmits<{
    (e: 'params', p: Record<string, string | number | null>): void
}>()

const periodChoice = ref('')

const pending       = computed(() => props.data?.pending ?? 0)
const inscritos     = computed(() => props.data?.inscritos ?? 0)
const admittedTotal = computed(() => props.data?.admittedTotal ?? 0)

function formatNum(n: number): string {
    return (n ?? 0).toLocaleString('es-MX')
}

function emitParams(): void {
    emit('params', { period_id: periodChoice.value })
}
</script>
