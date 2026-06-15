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
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-2 max-w-xl">
            <div class="flex items-center justify-between gap-2">
                <p class="font-semibold text-slate-700 uppercase text-[11px] tracking-wide">Formato del CSV</p>
                <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md bg-white border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition"
                    @click="downloadTemplate"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Descargar plantilla
                </button>
            </div>
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
                <strong>passed</strong>: 1 si acreditó, 0 si no.
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

            <!-- Preview / validación client-side -->
            <div v-if="csvPreview.length" class="border rounded-lg overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2 bg-slate-50 border-b text-xs">
                    <span class="font-semibold text-slate-600 uppercase tracking-wide">Vista previa</span>
                    <div class="flex items-center gap-3">
                        <span class="inline-flex items-center gap-1 text-green-700">
                            <span class="w-2 h-2 rounded-full bg-green-500"></span>{{ csvValidCount }} válidas
                        </span>
                        <span v-if="csvErrorCount" class="inline-flex items-center gap-1 text-red-600">
                            <span class="w-2 h-2 rounded-full bg-red-500"></span>{{ csvErrorCount }} con error
                        </span>
                    </div>
                </div>
                <div class="max-h-72 overflow-auto">
                    <table class="w-full text-xs">
                        <thead class="bg-slate-100 text-slate-500 sticky top-0">
                            <tr>
                                <th class="text-left px-2 py-1.5 font-medium">#</th>
                                <th class="text-left px-2 py-1.5 font-medium">Identificador</th>
                                <th class="text-left px-2 py-1.5 font-medium">Materia</th>
                                <th class="text-left px-2 py-1.5 font-medium">Tipo</th>
                                <th class="text-left px-2 py-1.5 font-medium">Sem.</th>
                                <th class="text-left px-2 py-1.5 font-medium">G1/G2/G3</th>
                                <th class="text-left px-2 py-1.5 font-medium">Acr.</th>
                                <th class="text-left px-2 py-1.5 font-medium">Validación</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="r in csvPreview"
                                :key="r.line"
                                class="border-t"
                                :class="r.error ? 'bg-red-50' : 'odd:bg-white even:bg-slate-50'"
                            >
                                <td class="px-2 py-1 text-slate-400 font-mono">{{ r.line }}</td>
                                <td class="px-2 py-1 font-mono">{{ r.identifier || '—' }}</td>
                                <td class="px-2 py-1 font-mono">{{ r.subject || '—' }}</td>
                                <td class="px-2 py-1 font-mono">{{ r.approval || '—' }}</td>
                                <td class="px-2 py-1 font-mono">{{ r.period || '—' }}</td>
                                <td class="px-2 py-1 font-mono">{{ r.grades }}</td>
                                <td class="px-2 py-1 font-mono">{{ r.passed }}</td>
                                <td class="px-2 py-1">
                                    <span v-if="r.error" class="text-red-600">{{ r.error }}</span>
                                    <span v-else class="text-green-600">✓</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p v-if="csvErrorCount" class="px-4 py-2 text-[11px] text-amber-700 bg-amber-50 border-t">
                    Las filas con error se enviarán igual; el servidor las rechazará y aparecerán en el reporte de abajo.
                    Corrige el archivo si quieres cargarlas.
                </p>
            </div>

            <button
                class="w-full px-4 py-3 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold uppercase disabled:opacity-50"
                :disabled="submitting || !csvFile || csvValidCount === 0"
                @click="submitCsv"
            >
                {{ submitting ? 'PROCESANDO...' : `CARGAR ${csvValidCount > 0 ? csvValidCount + ' ' : ''}CALIFICACIONES` }}
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

            <div v-else class="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 shrink-0">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Carga completada sin errores.
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const csvFile    = ref<File | null>(null)
const submitting = ref(false)
const result     = ref<any>(null)

// ── Preview client-side ─────────────────────────────────────────────────────
interface CsvPreviewRow {
    line: number
    identifier: string
    subject: string
    approval: string
    period: string
    grades: string
    passed: string
    error: string | null
}

const csvPreview     = ref<CsvPreviewRow[]>([])
const csvValidCount  = computed(() => csvPreview.value.filter(r => !r.error).length)
const csvErrorCount  = computed(() => csvPreview.value.filter(r => r.error).length)

function validGrade(v: string): boolean {
    if (v === '') return true
    const n = Number(v)
    return !isNaN(n) && n >= 0 && n <= 100
}

function parseCsvPreview(text: string) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '')
    const rows: CsvPreviewRow[] = []
    const seen = new Set<string>()
    // Salta la cabecera si la primera línea menciona "student_identifier".
    const start = lines.length && /student_identifier/i.test(lines[0]) ? 1 : 0
    for (let i = start; i < lines.length; i++) {
        const p = lines[i].split(/[,;]/).map(s => s.trim())
        const identifier = (p[0] ?? '').toUpperCase()
        const subject    = (p[1] ?? '').toUpperCase()
        const approval   = (p[2] ?? '').toUpperCase()
        const period     = p[3] ?? ''
        const g1 = p[4] ?? '', g2 = p[5] ?? '', g3 = p[6] ?? ''
        const passed = p[7] ?? ''
        const key = `${identifier}|${subject}|${approval}|${period}`

        let error: string | null = null
        if (!identifier)                              error = 'Identificador vacío'
        else if (!subject)                            error = 'Falta clave de materia'
        else if (!approval)                           error = 'Falta tipo de aprobación'
        else if (period !== '' && !/^\d+$/.test(period)) error = 'Semestre inválido'
        else if (!validGrade(g1) || !validGrade(g2) || !validGrade(g3)) error = 'Calificación fuera de rango (0–100)'
        else if (passed !== '' && passed !== '0' && passed !== '1')     error = 'Campo "passed" debe ser 0 o 1'
        else if (seen.has(key))                       error = 'Fila duplicada (mismo alumno/materia/tipo)'

        if (!error) seen.add(key)
        rows.push({
            line: i + 1,
            identifier, subject, approval, period,
            grades: [g1, g2, g3].map(g => g || '–').join('/'),
            passed: passed || '–',
            error,
        })
    }
    csvPreview.value = rows
}

function onCsvSelected(e: Event) {
    const input = e.target as HTMLInputElement
    csvFile.value = input.files?.[0] ?? null
    result.value = null
    csvPreview.value = []
    if (csvFile.value) {
        const reader = new FileReader()
        reader.onload = () => parseCsvPreview(String(reader.result ?? ''))
        reader.readAsText(csvFile.value)
    }
}

function downloadTemplate() {
    const content =
        'student_identifier,subject_code,approval_type,period_number,grade_1,grade_2,grade_3,passed\n' +
        'ABCD123456HDFXXX00,MAT101,ORD1,1,85,,,1\n' +
        'EFGH789012MDFYYY01,FIS201,EXT,2,50,72,,1\n'
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_calificaciones.csv'
    a.click()
    URL.revokeObjectURL(url)
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
        csvFile.value = null
        csvPreview.value = []
    } catch (e: any) {
        result.value = { total: 0, created: 0, updated: 0, errors: [{ row: 0, reason: e?.response?.data?.message ?? 'Error al procesar.' }] }
    } finally {
        submitting.value = false
    }
}
</script>
