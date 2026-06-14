<template>
    <div class="space-y-6">

        <!-- Encabezado -->
        <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Cargar Resultados de Examen</h1>
                <p class="mt-1 text-sm text-slate-500">
                    Carga las calificaciones del examen de admisión. Los aspirantes cambiarán al estado
                    <span class="font-semibold text-purple-700">Con Resultado</span>.
                </p>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
                <!-- Botón sincronizar (sólo si online + outbound configurado) -->
                <button
                    v-if="syncStatus?.enabled"
                    :disabled="syncing"
                    class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    @click="onSync"
                >
                    <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': syncing }" />
                    {{ syncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR DESDE SISTEMA EXTERNO' }}
                </button>

                <!-- Liberar resultados al portal -->
                <button
                    :disabled="releaseDisabled"
                    :title="(overview?.pendingRelease ?? 0) === 0 ? 'No hay resultados pendientes de liberar' : ''"
                    class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="confirmRelease"
                >
                    <PaperAirplaneIcon class="w-4 h-4" />
                    {{ releasing ? 'LIBERANDO...' : `LIBERAR RESULTADOS (${overview?.pendingRelease ?? 0})` }}
                </button>
            </div>
        </div>

        <!-- Tira de estado del proceso -->
        <div v-if="overview" class="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div class="rounded-lg border border-slate-200 bg-white p-3 text-center">
                <p class="text-2xl font-bold text-amber-600">{{ overview.pendingEvaluation }}</p>
                <p class="text-[11px] text-slate-500 uppercase mt-0.5">Por evaluar</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3 text-center" title="Presentaron pero no terminaron el examen (calificación capturada, sin pasar a Con Resultado)">
                <p class="text-2xl font-bold text-rose-600">{{ overview.notFinished }}</p>
                <p class="text-[11px] text-slate-500 uppercase mt-0.5">No terminó</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3 text-center">
                <p class="text-2xl font-bold text-purple-700">{{ overview.withScore }}</p>
                <p class="text-[11px] text-slate-500 uppercase mt-0.5">Con resultado</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3 text-center">
                <p class="text-2xl font-bold text-indigo-700">{{ overview.pendingRelease }}</p>
                <p class="text-[11px] text-slate-500 uppercase mt-0.5">Por liberar</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3 text-center">
                <p class="text-2xl font-bold text-emerald-700">{{ overview.released }}</p>
                <p class="text-[11px] text-slate-500 uppercase mt-0.5">Liberados</p>
            </div>
        </div>

        <div
            v-if="releaseBanner"
            class="border border-indigo-300 bg-indigo-50 rounded-lg p-3 text-sm text-indigo-800"
        >
            {{ releaseBanner }}
        </div>
        <p v-if="releaseError" class="text-xs text-red-600">{{ releaseError }}</p>

        <ConfirmModal
            v-model="confirmOpen"
            title="Liberar resultados a aspirantes"
            :message="releaseConfirmMessage"
            confirm-text="Liberar"
            variant="danger"
            @confirm="onRelease"
        />

        <!-- Resultado de la última sincronización -->
        <div
            v-if="syncResult"
            :class="[
                'border rounded-lg p-3 text-sm',
                syncResult.failed > 0 ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50',
            ]"
        >
            <p class="font-semibold">
                Procesados: {{ syncResult.processed }} ·
                Éxito: <span class="text-emerald-700">{{ syncResult.success }}</span> ·
                Fallidos: <span class="text-red-700">{{ syncResult.failed }}</span> ·
                Omitidos: <span class="text-slate-600">{{ syncResult.skipped }}</span>
            </p>
            <details v-if="(syncResult.errors?.length ?? 0) > 0" class="mt-1 text-xs">
                <summary class="cursor-pointer text-slate-600">Ver errores ({{ syncResult.errors?.length }})</summary>
                <ul class="mt-1 list-disc list-inside text-slate-600 space-y-0.5">
                    <li v-for="(e, i) in syncResult.errors?.slice(0, 20)" :key="i">{{ e }}</li>
                    <li v-if="(syncResult.errors?.length ?? 0) > 20" class="italic">... y más</li>
                </ul>
            </details>
        </div>
        <p v-else-if="syncError" class="text-xs text-red-600">{{ syncError }}</p>

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
            <button
                class="tab-btn"
                :class="tab === 'individual' ? 'tab-active' : 'tab-inactive'"
                @click="tab = 'individual'"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Asignar individual
            </button>
        </div>

        <!-- Panel Asignar individual -->
        <div v-if="tab === 'individual'" class="space-y-4 max-w-xl">
            <p class="text-xs text-slate-500">
                Busca un aspirante por nombre, CURP o folio y asígnale su calificación directamente.
            </p>

            <!-- Buscador -->
            <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input
                    v-model="indivQuery"
                    @input="onIndivSearchInput"
                    type="text"
                    placeholder="Buscar aspirante..."
                    class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition"
                />
            </div>

            <!-- Resultados de búsqueda -->
            <div v-if="indivSearching" class="text-xs text-slate-400 italic">Buscando...</div>
            <ul v-else-if="indivResults.length" class="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                <li
                    v-for="hit in indivResults"
                    :key="hit.id"
                    class="px-3 py-2 flex items-center justify-between gap-2 hover:bg-blue-50 cursor-pointer transition"
                    @click="selectIndiv(hit)"
                >
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-slate-800 truncate">{{ indivName(hit) }}</p>
                        <p class="text-[11px] text-slate-400 font-mono truncate">{{ hit.curp || hit.applicationFolio || '—' }}</p>
                    </div>
                    <span
                        class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        :class="hit.entranceScore ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'"
                    >{{ hit.entranceScore ? `Nota: ${hit.entranceScore}` : 'Sin nota' }}</span>
                </li>
            </ul>
            <p v-else-if="indivQuery.trim().length >= 2" class="text-xs text-slate-400 italic">Sin coincidencias.</p>

            <!-- Aspirante seleccionado -->
            <div v-if="indivSelected" class="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-3">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <p class="text-sm font-bold text-slate-800">{{ indivName(indivSelected) }}</p>
                        <p class="text-[11px] text-slate-500 font-mono">{{ indivSelected.curp || indivSelected.applicationFolio || '—' }}</p>
                    </div>
                    <button class="text-xs text-slate-400 hover:text-red-500 transition" @click="indivSelected = null">Cambiar</button>
                </div>
                <div class="flex items-end gap-2">
                    <div class="flex-1">
                        <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Calificación</label>
                        <input
                            v-model="indivScore"
                            type="number" min="0" max="999.99" step="0.01"
                            placeholder="Ej. 85.5"
                            class="field w-full"
                        />
                    </div>
                    <button
                        class="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition font-medium uppercase tracking-wide"
                        :disabled="indivSaving"
                        @click="saveIndivScore"
                    >
                        {{ indivSaving ? 'Guardando...' : 'Guardar' }}
                    </button>
                </div>
            </div>
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
                <button v-if="csvFile" class="mt-1 text-xs text-slate-400 hover:text-red-500 transition" @click="csvFile = null; csvPreview = []">
                    Quitar archivo
                </button>
            </div>

            <!-- Vista previa del CSV -->
            <div v-if="csvPreview.length" class="border border-slate-200 rounded-lg overflow-hidden">
                <div class="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs">
                    <span class="font-semibold text-slate-600 uppercase tracking-wide">Vista previa</span>
                    <span class="flex items-center gap-2">
                        <span class="text-green-700 font-semibold">{{ csvValidCount }} válidas</span>
                        <span v-if="csvErrorCount" class="text-red-600 font-semibold">{{ csvErrorCount }} con error</span>
                    </span>
                </div>
                <div class="max-h-60 overflow-y-auto">
                    <table class="w-full text-xs">
                        <thead class="bg-white sticky top-0 border-b border-slate-100">
                            <tr>
                                <th scope="col" class="px-3 py-1.5 text-left font-semibold text-slate-500 uppercase">CURP</th>
                                <th scope="col" class="px-3 py-1.5 text-left font-semibold text-slate-500 uppercase">Calif.</th>
                                <th scope="col" class="px-3 py-1.5 text-left font-semibold text-slate-500 uppercase">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="r in csvPreview.slice(0, 100)" :key="r.line" class="border-t border-slate-50" :class="r.error ? 'bg-red-50/50' : ''">
                                <td class="px-3 py-1.5 font-mono text-slate-700">{{ r.curp || '—' }}</td>
                                <td class="px-3 py-1.5 text-slate-700">{{ r.score || '—' }}</td>
                                <td class="px-3 py-1.5">
                                    <span v-if="r.error" class="text-red-600">{{ r.error }}</span>
                                    <span v-else class="text-green-600">✓</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p v-if="csvPreview.length > 100" class="px-3 py-1.5 text-[11px] text-slate-400 italic border-t border-slate-100">Mostrando las primeras 100 filas de {{ csvPreview.length }}.</p>
            </div>

            <p v-if="csvError" class="text-xs text-red-600">{{ csvError }}</p>

            <button
                class="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition font-medium uppercase tracking-wide"
                :disabled="submittingCsv || !csvFile || (csvPreview.length > 0 && csvValidCount === 0)"
                @click="submitCsv"
            >
                {{ submittingCsv ? 'Procesando...' : `Cargar Resultados${csvPreview.length ? ` (${csvValidCount})` : ''}` }}
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
                        <button aria-label="Eliminar fila"
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
                        <div class="overflow-x-auto w-full"><table class="w-full">
                            <thead class="bg-slate-100">
                                <tr>
                                    <th scope="col" class="px-3 py-2 text-left font-semibold text-slate-600 uppercase">CURP</th>
                                    <th scope="col" class="px-3 py-2 text-left font-semibold text-slate-600 uppercase">Motivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(err, i) in result.errors" :key="i" class="border-t border-slate-100">
                                    <td class="px-3 py-2 font-mono text-slate-700">{{ err.curp || '—' }}</td>
                                    <td class="px-3 py-2 text-red-600">{{ err.reason }}</td>
                                </tr>
                            </tbody>
                        </table></div>
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
import { computed, onMounted, ref } from 'vue'
import { ArrowPathIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'
import { useToast } from '@/app/composables/useToast'

const toast = useToast()

// ── Tabs ──────────────────────────────────────────────────────────────────────

const tab = ref<'csv' | 'manual' | 'individual'>('csv')

// ── Contadores del proceso (tira de estado) ──────────────────────────────────
interface Overview { pendingEvaluation: number; notFinished: number; withScore: number; released: number; pendingRelease: number }
const overview = ref<Overview | null>(null)

async function loadOverview() {
    try {
        const { data } = await api.get<Overview>(API.ADMISSIONS_API.applicants.scoresOverview)
        overview.value = data
    } catch {
        overview.value = null
    }
}

// ── Captura individual (buscar aspirante → asignar nota) ─────────────────────
interface SearchHit {
    id: number
    names: string
    firstSurname: string
    secondSurname: string | null
    applicationFolio: string | null
    curp: string | null
    status: number
    entranceScore: string | null
}
const indivQuery     = ref('')
const indivResults   = ref<SearchHit[]>([])
const indivSearching = ref(false)
const indivSelected  = ref<SearchHit | null>(null)
const indivScore     = ref('')
const indivSaving    = ref(false)
let indivTimeout: ReturnType<typeof setTimeout> | null = null

function indivName(h: SearchHit): string {
    return [h.firstSurname, h.secondSurname, h.names].filter(Boolean).join(' ')
}

function onIndivSearchInput() {
    if (indivTimeout) clearTimeout(indivTimeout)
    indivTimeout = setTimeout(runIndivSearch, 400)
}

async function runIndivSearch() {
    const term = indivQuery.value.trim()
    if (term.length < 2) { indivResults.value = []; return }
    indivSearching.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.applicants.list, {
            params: { per_page: 8, search: { q: term } },
        })
        indivResults.value = data.items ?? data.data ?? []
    } catch {
        indivResults.value = []
    } finally {
        indivSearching.value = false
    }
}

function selectIndiv(hit: SearchHit) {
    indivSelected.value = hit
    indivScore.value    = hit.entranceScore ?? ''
    indivResults.value  = []
    indivQuery.value    = ''
}

async function saveIndivScore() {
    if (!indivSelected.value) return
    const score = indivScore.value.trim()
    if (score === '' || isNaN(Number(score)) || Number(score) < 0 || Number(score) > 999.99) {
        toast.error('Ingresa una calificación válida (0 a 999.99).')
        return
    }
    indivSaving.value = true
    try {
        await api.post(API.ADMISSIONS_API.applicants.setScore(indivSelected.value.id), { score })
        toast.success(`Calificación ${score} asignada a ${indivName(indivSelected.value)}.`)
        indivSelected.value = null
        indivScore.value    = ''
        loadOverview()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo asignar la calificación.')
    } finally {
        indivSaving.value = false
    }
}

// ── Sincronización con sistema externo ────────────────────────────────────────

interface SyncStatus {
    mode: string
    providerKind: string
    configured: boolean
    enabled: boolean
}
interface SyncResult {
    processed: number
    success: number
    failed: number
    skipped: number
    errors?: string[]
}

const syncStatus = ref<SyncStatus | null>(null)
const syncResult = ref<SyncResult | null>(null)
const syncing    = ref(false)
const syncError  = ref<string | null>(null)

// ── Liberación de resultados al portal del aspirante ─────────────────────────
const confirmOpen   = ref(false)
const releasing     = ref(false)
const releaseBanner = ref<string | null>(null)
const releaseError  = ref<string | null>(null)

const releaseDisabled = computed(() => releasing.value || (overview.value?.pendingRelease ?? 0) === 0)
const releaseConfirmMessage = computed(() => {
    const n = overview.value?.pendingRelease ?? 0
    return `Se liberarán ${n} resultado(s) al portal de los aspirantes (todos los que tienen calificación capturada y aún no se habían liberado). Es por colegio, queda auditada y NO se puede deshacer.`
})

function confirmRelease(): void {
    confirmOpen.value = true
}

async function onRelease(): Promise<void> {
    releasing.value = true
    releaseBanner.value = null
    releaseError.value  = null
    try {
        const { data } = await api.post<{ released: number }>(
            API.ADMISSIONS_API.applicants.bulkRelease,
            {},
        )
        releaseBanner.value = `✓ Se liberaron ${data.released} resultados.`
        loadOverview()
    } catch (e: unknown) {
        releaseError.value = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
            ?? 'No se pudo liberar.'
    } finally {
        releasing.value = false
    }
}

async function loadSyncStatus() {
    try {
        const { data } = await api.get<SyncStatus>(API.ADMISSIONS_API.examOnlineSync.status)
        syncStatus.value = data
    } catch {
        syncStatus.value = null
    }
}

async function onSync() {
    syncing.value = true
    syncError.value = null
    try {
        const { data } = await api.post<SyncResult>(API.ADMISSIONS_API.examOnlineSync.run)
        syncResult.value = data
    } catch (e: any) {
        syncResult.value = null
        syncError.value = e?.response?.data?.message ?? 'No se pudo sincronizar.'
    } finally {
        syncing.value = false
    }
}

onMounted(() => {
    loadSyncStatus()
    loadOverview()
})

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

// Preview client-side del CSV (curp, calificación) antes de cargar.
interface CsvPreviewRow { line: number; curp: string; score: string; error: string | null }
const csvPreview = ref<CsvPreviewRow[]>([])
const csvValidCount = computed(() => csvPreview.value.filter(r => !r.error).length)
const csvErrorCount = computed(() => csvPreview.value.filter(r => r.error).length)

function parseCsvPreview(text: string) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '')
    const rows: CsvPreviewRow[] = []
    const seen = new Set<string>()
    // Salta la cabecera si la primera línea menciona "curp".
    const start = lines.length && /curp/i.test(lines[0]) ? 1 : 0
    for (let i = start; i < lines.length; i++) {
        const parts = lines[i].split(/[,;]/).map(p => p.trim())
        const curp  = (parts[0] ?? '').toUpperCase()
        const score = parts[1] ?? ''
        let error: string | null = null
        if (!curp)                                       error = 'CURP vacía'
        else if (curp.length !== 18)                     error = 'CURP inválida (18 caracteres)'
        else if (seen.has(curp))                         error = 'CURP duplicada'
        else if (score === '' || isNaN(Number(score)))   error = 'Calificación inválida'
        else if (Number(score) < 0 || Number(score) > 999.99) error = 'Calificación fuera de rango'
        if (curp) seen.add(curp)
        rows.push({ line: i + 1, curp, score, error })
    }
    csvPreview.value = rows
}

function onCsvSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null
    csvFile.value  = file
    csvError.value = null
    result.value   = null
    csvPreview.value = []
    if (file) {
        const reader = new FileReader()
        reader.onload = () => parseCsvPreview(String(reader.result ?? ''))
        reader.readAsText(file)
    }
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
        result.value     = data
        csvFile.value    = null
        csvPreview.value = []
        loadOverview()
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
    return new Set(Object.keys(counts).filter(k => (counts[k] ?? 0) > 1))
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
        loadOverview()
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
