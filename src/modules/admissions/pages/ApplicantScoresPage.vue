<template>
    <div class="space-y-6">

        <!-- Encabezado -->
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Cargar Resultados de Examen</h1>
            <p class="mt-1 text-sm text-slate-500">
                Carga las calificaciones del examen de admisión. Los aspirantes cambiarán al estado
                <span class="font-semibold text-purple-700">Con Resultado</span>.
            </p>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 border-b border-slate-200">
            <button
                class="tab-btn"
                :class="tab === 'csv' ? 'tab-active' : 'tab-inactive'"
                @click="tab = 'csv'"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Cargar CSV
            </button>
            <button
                class="tab-btn"
                :class="tab === 'manual' ? 'tab-active' : 'tab-inactive'"
                @click="tab = 'manual'"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
                Carga Manual (JSON)
            </button>
        </div>

        <!-- Panel CSV -->
        <div v-if="tab === 'csv'" class="space-y-4 max-w-xl">

            <!-- Formato esperado -->
            <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-1">
                <p class="font-semibold text-slate-700 uppercase text-[11px] tracking-wide">Formato del CSV</p>
                <p>El archivo debe tener cabecera y dos columnas:</p>
                <pre class="mt-1 bg-white border border-slate-200 rounded p-2 text-xs font-mono">curp,calificacion
ABCD123456HDFXXX00,85.5
EFGH789012MDFYYY01,72.0</pre>
            </div>

            <!-- Periodo académico (opcional) -->
            <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Período Académico <span class="font-normal text-slate-400">(Opcional — para mayor precisión)</span></label>
                <FormRemoteSelect
                    v-model="csvPeriodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                    :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                    item-label="name"
                    item-value="academicPeriodId"
                    placeholder="Todos los períodos..."
                />
            </div>

            <!-- Zona de archivo -->
            <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Archivo CSV</label>
                <label
                    class="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-lg p-8 cursor-pointer transition"
                    :class="csvFile ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'"
                >
                    <svg v-if="!csvFile" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-slate-400">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-green-500">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-sm" :class="csvFile ? 'text-green-700 font-medium' : 'text-slate-500'">
                        {{ csvFile ? csvFile.name : 'Haz clic o arrastra tu archivo .csv aquí' }}
                    </span>
                    <input type="file" accept=".csv,text/csv" class="hidden" @change="onCsvSelected" />
                </label>
                <button v-if="csvFile" class="mt-1 text-xs text-slate-400 hover:text-red-500 transition" @click="csvFile = null">
                    Quitar archivo
                </button>
            </div>

            <p v-if="csvError" class="text-xs text-red-600">{{ csvError }}</p>

            <button
                class="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition font-medium uppercase tracking-wide"
                :disabled="submittingCsv || !csvFile"
                @click="submitCsv"
            >
                {{ submittingCsv ? 'Procesando...' : 'Cargar Resultados' }}
            </button>
        </div>

        <!-- Panel Manual -->
        <div v-if="tab === 'manual'" class="space-y-4 max-w-xl">

            <!-- Periodo académico (opcional) -->
            <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Período Académico <span class="font-normal text-slate-400">(Opcional)</span></label>
                <FormRemoteSelect
                    v-model="manualPeriodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                    :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                    item-label="name"
                    item-value="academicPeriodId"
                    placeholder="Todos los períodos..."
                />
            </div>

            <!-- Filas de CURP + calificación -->
            <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Resultados</label>
                <div class="space-y-2">
                    <div v-for="(row, i) in manualRows" :key="i" class="flex gap-2 items-start">
                        <div class="flex-1">
                            <input
                                v-model="row.curp"
                                type="text"
                                maxlength="18"
                                placeholder="Ej. ABCD123456HDFYYY00"
                                :class="['field field-upper w-full', isDuplicateCurp(row.curp) ? 'field-error' : '']"
                            />
                            <p v-if="isDuplicateCurp(row.curp)" class="mt-0.5 text-[11px] text-red-500 font-medium">
                                CURP duplicada en la lista
                            </p>
                        </div>
                        <div class="flex-1">
                        <input
                            v-model="row.score"
                            type="number"
                            min="0"
                            max="999.99"
                            step="0.01"
                            placeholder="Calif."
                            class="field w-28"
                        />
                        </div>
                        <button
                            type="button"
                            class="mt-1 p-1.5 rounded-md border text-slate-400 hover:text-red-500 hover:border-red-300 transition"
                            title="Eliminar fila"
                            :disabled="manualRows.length === 1"
                            @click="removeManualRow(i)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    class="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition"
                    @click="addManualRow"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Agregar fila
                </button>
            </div>

            <p v-if="manualError" class="text-xs text-red-600">{{ manualError }}</p>

            <button
                class="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition font-medium uppercase tracking-wide"
                :disabled="submittingManual"
                @click="submitManual"
            >
                {{ submittingManual ? 'Procesando...' : 'Cargar Resultados' }}
            </button>
        </div>

        <!-- Resultado de la carga -->
        <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0">
            <div v-if="result" class="max-w-xl space-y-3 border rounded-xl p-5 bg-white shadow-sm">
                <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">Resultado de la Carga</h2>

                <div class="flex gap-4 text-sm">
                    <div class="flex-1 rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                        <p class="text-2xl font-bold text-slate-800">{{ result.total }}</p>
                        <p class="text-xs text-slate-500 uppercase mt-0.5">Total</p>
                    </div>
                    <div class="flex-1 rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                        <p class="text-2xl font-bold text-green-700">{{ result.updated }}</p>
                        <p class="text-xs text-green-600 uppercase mt-0.5">Actualizados</p>
                    </div>
                    <div class="flex-1 rounded-lg bg-red-50 border border-red-200 p-3 text-center">
                        <p class="text-2xl font-bold text-red-700">{{ result.errors.length }}</p>
                        <p class="text-xs text-red-500 uppercase mt-0.5">Con Error</p>
                    </div>
                </div>

                <div v-if="result.errors.length > 0">
                    <p class="text-xs font-semibold text-slate-600 uppercase mb-2">Detalle de errores</p>
                    <div class="border rounded-lg overflow-hidden text-xs">
                        <table class="w-full">
                            <thead class="bg-slate-100">
                                <tr>
                                    <th class="px-3 py-2 text-left font-semibold text-slate-600 uppercase">CURP</th>
                                    <th class="px-3 py-2 text-left font-semibold text-slate-600 uppercase">Motivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(err, i) in result.errors" :key="i" class="border-t border-slate-100">
                                    <td class="px-3 py-2 font-mono text-slate-700">{{ err.curp || '—' }}</td>
                                    <td class="px-3 py-2 text-red-600">{{ err.reason }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <button class="text-xs text-slate-400 hover:text-slate-600 transition" @click="result = null">
                    Cerrar resultado
                </button>
            </div>
        </Transition>

    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

// ── Tabs ──────────────────────────────────────────────────────────────────────

const tab = ref<'csv' | 'manual'>('csv')

// ── Resultado compartido ──────────────────────────────────────────────────────

interface ScoreResult {
    total: number
    updated: number
    errors: { curp: string; reason: string }[]
}

const result = ref<ScoreResult | null>(null)

// ── CSV ───────────────────────────────────────────────────────────────────────

const csvFile      = ref<File | null>(null)
const csvPeriodId  = ref<number | null>(null)
const csvError     = ref<string | null>(null)
const submittingCsv = ref(false)

function onCsvSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null
    csvFile.value  = file
    csvError.value = null
    result.value   = null
}

async function submitCsv() {
    if (!csvFile.value) return
    csvError.value  = null
    result.value    = null
    submittingCsv.value = true

    try {
        const fd = new FormData()
        fd.append('file', csvFile.value)
        if (csvPeriodId.value) fd.append('academic_period_id', String(csvPeriodId.value))

        const { data } = await api.post(API.ADMISSIONS_API.applicantScores.csv, fd)
        result.value  = data
        csvFile.value = null
    } catch (e: any) {
        csvError.value = e?.response?.data?.message ?? 'Error al procesar el archivo.'
    } finally {
        submittingCsv.value = false
    }
}

// ── Manual ────────────────────────────────────────────────────────────────────

interface ManualRow { curp: string; score: string }

const manualRows      = ref<ManualRow[]>([{ curp: '', score: '' }])
const manualPeriodId  = ref<number | null>(null)
const manualError     = ref<string | null>(null)
const submittingManual = ref(false)

// CURPs que aparecen más de una vez en la lista
const duplicatedCurps = computed(() => {
    const counts: Record<string, number> = {}
    for (const row of manualRows.value) {
        const curp = row.curp.trim().toUpperCase()
        if (curp) counts[curp] = (counts[curp] ?? 0) + 1
    }
    return new Set(Object.keys(counts).filter(k => counts[k] > 1))
})

function isDuplicateCurp(curp: string): boolean {
    return duplicatedCurps.value.has(curp.trim().toUpperCase())
}

function addManualRow() {
    manualRows.value.push({ curp: '', score: '' })
}

function removeManualRow(i: number) {
    if (manualRows.value.length > 1) manualRows.value.splice(i, 1)
}

async function submitManual() {
    manualError.value = null
    result.value      = null

    const filled = manualRows.value.filter(r => r.curp.trim() && r.score !== null && r.score !== undefined && String(r.score).trim() !== '')
    if (filled.length === 0) {
        manualError.value = 'Ingresa al menos un registro con CURP y calificación.'
        return
    }
    if (duplicatedCurps.value.size > 0) {
        manualError.value = 'Hay CURPs duplicadas en la lista. Corrígelas antes de continuar.'
        return
    }

    submittingManual.value = true
    try {
        const payload: Record<string, any> = {
            results: filled.map(r => ({ curp: r.curp.trim().toUpperCase(), score: r.score })),
        }
        if (manualPeriodId.value) payload.academic_period_id = manualPeriodId.value

        const { data } = await api.post(API.ADMISSIONS_API.applicantScores.json, payload)
        result.value   = data
        manualRows.value = [{ curp: '', score: '' }]
    } catch (e: any) {
        manualError.value = e?.response?.data?.message ?? 'Error al cargar los resultados.'
    } finally {
        submittingManual.value = false
    }
}
</script>

<style scoped>
.field {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    outline: none;
    transition: box-shadow 0.15s;
}
.field:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px #e0e7ff;
}
.field-upper { text-transform: uppercase; }
.field-error {
    border-color: #ef4444;
    background-color: #fff5f5;
}
.field-error:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 2px #fee2e2;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
}
.tab-active  { color: #2563eb; border-bottom-color: #2563eb; }
.tab-inactive { color: #94a3b8; }
.tab-inactive:hover { color: #475569; }
</style>
