<template>
    <!-- MODO SETTINGS -->
    <div v-if="view === 'settings'" class="h-full flex flex-col text-xs space-y-3">
        <div>
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Comparar con
            </label>
            <select
                v-model="compareWith"
                class="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
                @change="emitParams"
            >
                <option value="">{{ autoLabel }}</option>
                <option
                    v-for="p in (data?.availablePeriods ?? [])"
                    :key="p.id"
                    :value="String(p.id)"
                >
                    {{ p.shortName ?? p.name }}
                </option>
            </select>
        </div>

        <div v-if="data?.canChooseScope">
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Vista
            </label>
            <div class="inline-flex bg-slate-100 rounded-lg p-0.5 w-full">
                <button
                    class="flex-1 px-2 py-1 text-xs rounded-md transition"
                    :class="scopeChoice === 'campus' ? activeBtn : inactiveBtn"
                    @click="setScope('campus')"
                >
                    Campus
                </button>
                <button
                    class="flex-1 px-2 py-1 text-xs rounded-md transition"
                    :class="scopeChoice === 'career' ? activeBtn : inactiveBtn"
                    @click="setScope('career')"
                >
                    Mi carrera
                </button>
            </div>
        </div>

        <div class="text-[10px] text-slate-400 mt-auto">
            Cambios aplican al cerrar la configuración.
        </div>
    </div>

    <!-- MODO DATA -->
    <div v-else class="h-full flex flex-col text-xs">
        <div class="flex items-center gap-1 text-slate-500 mb-2">
            <span class="font-medium text-slate-700">
                {{ data?.currentPeriod?.shortName ?? '—' }}
            </span>
            <span>vs</span>
            <span class="truncate" :title="data?.comparePeriod?.shortName ?? ''">
                {{ data?.comparePeriod?.shortName ?? '—' }}
            </span>
            <span
                v-if="data?.canChooseScope"
                class="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                :class="data?.currentScope === 'career' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'"
            >
                {{ data?.currentScope === 'career' ? 'Mi carrera' : 'Campus' }}
            </span>
        </div>

        <div v-if="loading && !data" class="text-slate-400 italic">Cargando…</div>

        <div v-else-if="!rows.length" class="text-slate-400 italic">
            Sin aspirantes en el periodo.
        </div>

        <div v-else class="space-y-2 flex-1 overflow-y-auto pr-1">
            <div
                v-for="(row, idx) in rows"
                :key="idx"
                class="relative h-10 rounded overflow-hidden bg-slate-100"
            >
                <div
                    class="absolute inset-y-0 left-0 transition-all duration-300"
                    :class="barColor(row)"
                    :style="{ width: barWidth(row) }"
                />
                <div class="relative h-full px-2 flex items-center justify-between gap-2">
                    <div
                        class="text-[10px] uppercase tracking-wide text-slate-700 truncate font-medium"
                        :title="row.label"
                    >
                        {{ row.label }}
                    </div>
                    <div class="flex items-baseline gap-1 shrink-0">
                        <span class="text-lg font-semibold text-slate-800 leading-none">
                            {{ formatNum(row.current) }}
                        </span>
                        <span class="text-[10px] text-slate-500">
                            / {{ formatNum(row.compare) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="error" class="mt-2 text-rose-600">No se pudo cargar.</div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface PeriodRef { id: number; name: string; shortName: string | null }
interface Row       { label: string; current: number; compare: number }
interface Payload {
    currentPeriod:    PeriodRef | null
    comparePeriod:    PeriodRef | null
    rows:             Row[]
    availablePeriods: PeriodRef[]
    currentScope:     'campus' | 'career'
    canChooseScope:   boolean
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

const compareWith = ref<string>('')
const scopeChoice = ref<'campus' | 'career'>('campus')

watch(() => props.data?.currentScope, (s) => {
    if (s) scopeChoice.value = s
}, { immediate: true })

const activeBtn   = 'bg-white shadow text-slate-800'
const inactiveBtn = 'text-slate-500 hover:text-slate-700'

const autoLabel = computed(() =>
    props.data?.comparePeriod?.shortName
        ? `(auto: ${props.data.comparePeriod.shortName})`
        : '(año-1 auto)',
)

const rows = computed<Row[]>(() => props.data?.rows ?? [])

function emitParams(): void {
    emit('params', {
        compare_with: compareWith.value,
        scope:        props.data?.canChooseScope ? scopeChoice.value : null,
    })
}

function setScope(s: 'campus' | 'career'): void {
    scopeChoice.value = s
    emitParams()
}

function barWidth(row: Row): string {
    if (!row.compare || row.compare <= 0) return '0%'
    const pct = Math.min(row.current / row.compare, 1) * 100
    return `${pct.toFixed(1)}%`
}

function barColor(row: Row): string {
    if (!row.compare || row.compare <= 0) return 'bg-slate-200'
    if (row.current >= row.compare)        return 'bg-emerald-300'
    if (row.current >= row.compare * 0.66) return 'bg-blue-300'
    if (row.current >= row.compare * 0.33) return 'bg-amber-300'
    return 'bg-rose-300'
}

function formatNum(n: number): string {
    return (n ?? 0).toLocaleString('es-MX')
}
</script>
