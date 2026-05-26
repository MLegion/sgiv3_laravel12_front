<template>
    <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-2xl font-semibold">Reporte de Fichas</h1>

            <button
                class="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-100 print:hidden"
                @click="printReport"
            >
                <PrinterIcon class="w-4 h-4" />
                Imprimir
            </button>
        </div>

        <!-- Selectores (no se imprimen) -->
        <div class="flex flex-wrap items-end gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 print:hidden">
            <div>
                <label class="block text-xs text-slate-500 mb-1">Periodo actual</label>
                <select
                    v-model.number="periodId"
                    class="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white min-w-[180px]"
                    :disabled="loading"
                    @change="reload"
                >
                    <option v-if="!data?.availablePeriods?.length" :value="null">—</option>
                    <option v-for="p in data?.availablePeriods ?? []" :key="p.id" :value="p.id">
                        {{ p.shortName ?? p.name }}
                    </option>
                </select>
            </div>

            <div>
                <label class="block text-xs text-slate-500 mb-1">Comparar con</label>
                <select
                    v-model.number="comparePeriodId"
                    class="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white min-w-[180px]"
                    :disabled="loading"
                    @change="reload"
                >
                    <option :value="null">(Año-1 automático)</option>
                    <option v-for="p in data?.availablePeriods ?? []" :key="p.id" :value="p.id">
                        {{ p.shortName ?? p.name }}
                    </option>
                </select>
            </div>

            <div v-if="data?.canChooseScope">
                <label class="block text-xs text-slate-500 mb-1">Vista</label>
                <div class="inline-flex bg-slate-100 rounded-lg p-0.5">
                    <button
                        class="px-3 py-1.5 text-sm rounded-md transition"
                        :class="scope === 'campus' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'"
                        :disabled="loading"
                        @click="setScope('campus')"
                    >
                        Campus
                    </button>
                    <button
                        class="px-3 py-1.5 text-sm rounded-md transition"
                        :class="scope === 'career' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'"
                        :disabled="loading"
                        @click="setScope('career')"
                    >
                        Mi carrera
                    </button>
                </div>
            </div>

            <button
                class="ml-auto inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                :disabled="loading"
                @click="reload"
            >
                <ArrowPathIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
                Actualizar
            </button>
        </div>

        <!-- Bloque imprimible -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4 print:shadow-none print:border-0">
            <div class="hidden print:block mb-4 text-center">
                <h2 class="text-xl font-bold uppercase">
                    Reporte de Fichas {{ currentYear ?? '' }}
                </h2>
            </div>

            <FichasMatrix :data="data" :loading="loading" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FichasMatrix from '@/modules/admissions/components/FichasMatrix.vue'
import { PrinterIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

interface PeriodRef { id: number; name: string; shortName: string | null }
interface Payload {
    currentPeriod:    PeriodRef | null
    comparePeriod:    PeriodRef | null
    modalities:       any[]
    careers:          any[]
    cells:            any[]
    totalsByModality: any[]
    grandTotal:       { current: number; compare: number }
    availablePeriods: PeriodRef[]
    currentScope:     'campus' | 'career'
    canChooseScope:   boolean
}

const data            = ref<Payload | null>(null)
const loading         = ref(false)
const periodId        = ref<number | null>(null)
const comparePeriodId = ref<number | null>(null)
const scope           = ref<'campus' | 'career'>('campus')

const currentYear = computed(() => {
    const s = data.value?.currentPeriod?.shortName ?? null
    if (!s) return null
    const m = s.match(/(\d{4})/)
    return m ? m[1] : null
})

function setScope(s: 'campus' | 'career'): void {
    scope.value = s
    reload()
}

async function reload(): Promise<void> {
    loading.value = true
    try {
        const params = new URLSearchParams()
        if (periodId.value)        params.set('academic_period_id', String(periodId.value))
        if (comparePeriodId.value) params.set('compare_with',       String(comparePeriodId.value))
        if (data.value?.canChooseScope) params.set('scope', scope.value)

        const { data: res } = await api.get<Payload>(API.ADMISSIONS_API.reports.fichas(params.toString()))
        data.value = res
        // Sincronizamos los selectores con lo que devolvió el backend la primera vez.
        if (periodId.value === null)        periodId.value        = res.currentPeriod?.id ?? null
        if (comparePeriodId.value === null) comparePeriodId.value = res.comparePeriod?.id ?? null
        if (scope.value !== res.currentScope) scope.value = res.currentScope
    } finally {
        loading.value = false
    }
}

function printReport(): void {
    window.print()
}

onMounted(reload)
</script>

<style>
@media print {
    body { background: white; }
}
</style>
