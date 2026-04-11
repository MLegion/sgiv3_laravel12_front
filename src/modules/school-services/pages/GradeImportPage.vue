<template>
    <div class="space-y-6">

        <!-- Encabezado -->
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Carga de Calificaciones</h1>
            <p class="mt-1 text-sm text-slate-500">
                Importa calificaciones de forma masiva mediante archivo CSV.
            </p>
        </div>

        <!-- Formato esperado -->
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-1 max-w-xl">
            <p class="font-semibold text-slate-700 uppercase text-[11px] tracking-wide">Formato del CSV</p>
            <p>El archivo debe tener cabecera con las siguientes columnas:</p>
            <pre class="mt-1 bg-white border border-slate-200 rounded p-2 text-xs font-mono overflow-x-auto">student_identifier,subject_code,approval_type,period_number,grade_1,grade_2,grade_3,passed
ABCD123456HDFXXX00,MAT101,ORD1,1,85,,,1
EFGH789012MDFYYY01,FIS201,EXT,2,50,72,,1
IJKL345678HDFZZZ02,QUI301,ORD1,3,0,,,0</pre>
            <p class="mt-1 text-slate-400">
                <strong>student_identifier</strong>: CURP o folio de inscripcion.
                <strong>subject_code</strong>: clave oficial de la materia.
                <strong>approval_type</strong>: clave corta (ORD1, ORD2, EXT, ESP, REP).
                <strong>period_number</strong>: semestre (1, 2, 3...).
                <strong>grade_1/2/3</strong>: calificacion por oportunidad (0 si reprobo, vacio si no aplica).
            </p>
        </div>

        <!-- Zona de archivo -->
        <div class="max-w-xl space-y-4">
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
                        {{ csvFile ? csvFile.name : 'Haz clic o arrastra tu archivo .csv aqui' }}
                    </span>
                    <input type="file" accept=".csv,text/csv" class="hidden" @change="onCsvSelected" />
                </label>
            </div>

            <button
                class="w-full px-4 py-3 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold uppercase disabled:opacity-50"
                :disabled="submitting || !csvFile"
                @click="submitCsv"
            >
                {{ submitting ? 'PROCESANDO...' : 'CARGAR CALIFICACIONES' }}
            </button>
        </div>

        <!-- Resultados -->
        <div v-if="result" class="max-w-xl space-y-3">
            <div class="grid grid-cols-3 gap-3 text-center">
                <div class="bg-white border rounded-lg p-4">
                    <p class="text-2xl font-bold text-slate-800">{{ result.total }}</p>
                    <p class="text-xs text-slate-500 uppercase">Total filas</p>
                </div>
                <div class="bg-white border rounded-lg p-4">
                    <p class="text-2xl font-bold text-green-600">{{ result.created }}</p>
                    <p class="text-xs text-slate-500 uppercase">Creados</p>
                </div>
                <div class="bg-white border rounded-lg p-4">
                    <p class="text-2xl font-bold text-blue-600">{{ result.updated }}</p>
                    <p class="text-xs text-slate-500 uppercase">Actualizados</p>
                </div>
            </div>

            <div v-if="result.errors?.length" class="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <p class="text-xs font-semibold text-red-700 uppercase">Errores ({{ result.errors.length }})</p>
                <div v-for="(err, i) in result.errors" :key="i" class="text-xs text-red-600">
                    <span class="font-mono font-semibold">Fila {{ err.row }}:</span> {{ err.reason }}
                </div>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const csvFile   = ref<File | null>(null)
const submitting = ref(false)
const result    = ref<any>(null)

function onCsvSelected(e: Event) {
    const input = e.target as HTMLInputElement
    csvFile.value = input.files?.[0] ?? null
    result.value = null
}

async function submitCsv() {
    if (!csvFile.value) return
    submitting.value = true
    result.value = null
    try {
        const fd = new FormData()
        fd.append('file', csvFile.value)
        const { data } = await api.post(API.SCHOOL_SERVICES_API.gradeImport.csv, fd)
        result.value = data
    } catch (e: any) {
        result.value = { total: 0, created: 0, updated: 0, errors: [{ row: 0, reason: e?.response?.data?.message ?? 'Error al procesar.' }] }
    } finally {
        submitting.value = false
    }
}
</script>
