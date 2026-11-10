<template>
    <div class="p-4 md:p-6 max-w-[1600px] mx-auto">
        <div class="flex items-center justify-between gap-3 mb-1">
            <h1 class="text-xl font-semibold text-slate-800">Seguimiento de la trayectoria académica</h1>
            <div class="flex items-center gap-2">
                <button @click="$router.back()" class="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50">← Volver</button>
                <button @click="downloadOficial" :disabled="generating || !subjects.length"
                    class="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6M9 17h3"/></svg>
                    {{ generating ? 'Generando…' : 'Formato oficial' }}
                </button>
            </div>
        </div>
        <p class="text-sm text-slate-500 mb-4">
            <span v-if="head.carrera"><b>Carrera:</b> {{ head.carrera }} · </span>
            <span v-if="head.grupo"><b>Grupo:</b> {{ head.grupo }} · </span>
            <span v-if="head.semestre"><b>Semestre:</b> {{ head.semestre }} · </span>
            <span v-if="head.periodo"><b>Periodo:</b> {{ head.periodo }} · </span>
            <span v-if="head.tutor"><b>Tutor(a):</b> {{ head.tutor }}</span>
        </p>

        <div v-if="loading" class="text-sm text-slate-500">Cargando…</div>
        <div v-else-if="!students.length" class="text-sm text-slate-500">
            Este grupo no tiene tutorados sincronizados todavía.
        </div>
        <div v-else-if="!subjects.length" class="text-sm text-slate-500">
            El grupo no tiene materias con carga en este periodo.
        </div>

        <template v-else>
            <p class="text-xs text-slate-400 mb-2">
                Las calificaciones las capturan los docentes en Mi Docencia (por unidad y final). Vista de solo lectura.
            </p>
            <div class="overflow-x-auto rounded-xl border border-slate-200">
                <table class="text-xs border-collapse">
                    <thead class="bg-slate-50 text-slate-600">
                        <tr>
                            <th rowspan="2" class="px-2 py-2 text-left sticky left-0 bg-slate-50 border-r border-slate-200 z-10">No. Control</th>
                            <th rowspan="2" class="px-2 py-2 text-left sticky left-[86px] bg-slate-50 border-r border-slate-200 z-10 min-w-[200px]">Alumno</th>
                            <th v-for="s in subjects" :key="s.teacher_assignment_id" :colspan="s.units_count + 1"
                                class="px-2 py-1 text-center border-l border-slate-300">
                                <div class="font-semibold truncate max-w-[220px] mx-auto">{{ s.materia }}</div>
                                <div class="font-normal text-[10px] text-slate-400 truncate max-w-[220px] mx-auto">{{ s.docente || 'Sin docente' }}</div>
                            </th>
                        </tr>
                        <tr>
                            <template v-for="s in subjects" :key="'u' + s.teacher_assignment_id">
                                <th v-for="u in s.units_count" :key="s.teacher_assignment_id + '-' + u"
                                    class="px-1.5 py-1 text-center font-medium border-l border-slate-200 w-10">{{ roman(u) }}</th>
                                <th class="px-1.5 py-1 text-center font-semibold border-l border-slate-300 bg-slate-100 w-12">FIN</th>
                            </template>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="st in students" :key="st.student_id" class="hover:bg-slate-50/60">
                            <td class="px-2 py-1 font-mono sticky left-0 bg-white border-r border-slate-200">{{ st.num_control }}</td>
                            <td class="px-2 py-1 sticky left-[86px] bg-white border-r border-slate-200 whitespace-nowrap">{{ st.nombre }}</td>
                            <template v-for="s in subjects" :key="st.student_id + '-' + s.teacher_assignment_id">
                                <td v-for="u in s.units_count" :key="st.student_id + '-' + s.teacher_assignment_id + '-' + u"
                                    class="px-1.5 py-1 text-center border-l border-slate-100 tabular-nums">
                                    {{ unitGrade(s.teacher_assignment_id, st.student_id, u) }}
                                </td>
                                <td class="px-1.5 py-1 text-center border-l border-slate-300 bg-slate-50/70">
                                    <span v-if="final(s.teacher_assignment_id, st.student_id)"
                                        class="font-semibold tabular-nums"
                                        :class="final(s.teacher_assignment_id, st.student_id)!.passed ? 'text-emerald-600' : 'text-rose-600'">
                                        {{ final(s.teacher_assignment_id, st.student_id)!.grade }}
                                    </span>
                                    <span v-else class="text-slate-300">—</span>
                                </td>
                            </template>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useReportGenerator } from '@/modules/reports/composables/useReportGenerator'

const props = defineProps<{ id: string | number }>()
const toast = useToast()
const T = API.TUTORING_API
const reportGen = useReportGenerator()

interface Subject { teacher_assignment_id: number; subject_id: number; materia: string; official_code?: string | null; docente?: string | null; units_count: number; target_semester?: number | null }
interface Student { student_id: number; num_control: string; nombre: string }
interface UnitCell { grade: number | null; opportunity: number }
interface FinalCell { grade: number; passed: boolean; opportunity: number }

const loading = ref(false)
const generating = ref(false)
const subjects = ref<Subject[]>([])
const students = ref<Student[]>([])
const units = ref<Record<number, Record<number, Record<number, UnitCell>>>>({})
const finals = ref<Record<number, Record<number, FinalCell>>>({})
const head = reactive<{ tutor: string; carrera: string; grupo: string; periodo: string; semestre: number | null }>(
    { tutor: '', carrera: '', grupo: '', periodo: '', semestre: null })

// 1→I, 2→II… (hasta cubrir el nº de unidades de cualquier materia).
function roman(n: number): string {
    const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
    let r = '', x = n
    for (const [v, s] of map) while (x >= v) { r += s; x -= v }
    return r || '·'
}
function unitGrade(ta: number, sid: number, u: number): string {
    const c = units.value[ta]?.[sid]?.[u]
    if (!c || c.grade == null) return ''
    return Number.isInteger(c.grade) ? String(c.grade) : c.grade.toFixed(1)
}
function final(ta: number, sid: number): FinalCell | null {
    return finals.value[ta]?.[sid] ?? null
}

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(T.assignments.trayectoria(props.id))
        subjects.value = data.subjects ?? []
        students.value = data.students ?? []
        units.value = data.units ?? {}
        finals.value = data.finals ?? {}
        head.tutor = data.header?.tutor ?? ''
        head.carrera = data.header?.carrera ?? ''
        head.grupo = data.header?.grupo ?? ''
        head.periodo = data.header?.periodo ?? ''
        head.semestre = data.header?.semestre ?? null
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar la trayectoria.') }
    finally { loading.value = false }
}

/**
 * Contexto para la plantilla del reporteador (RPT.TUT_SEGUIMIENTO_TRAYECTORIA):
 * encabezado + materias (columnas, con sus unidades) + estudiantes (filas, con las
 * celdas alineadas a cada materia). La matriz se pivota aquí a la forma que itera
 * docxtemplater ({#estudiantes}{#materias}{#unidades}…).
 */
function buildReportContext(): Record<string, any> {
    const materias = subjects.value.map(s => ({
        materia: s.materia,
        docente: s.docente || '',
        official_code: s.official_code || '',
        units_count: s.units_count,
        unidades: Array.from({ length: s.units_count }, (_, i) => ({ label: roman(i + 1) })),
    }))
    const estudiantes = students.value.map((st, idx) => ({
        no: idx + 1,
        num_control: st.num_control,
        nombre: st.nombre,
        materias: subjects.value.map(s => {
            const f = final(s.teacher_assignment_id, st.student_id)
            return {
                unidades: Array.from({ length: s.units_count }, (_, i) => ({ v: unitGrade(s.teacher_assignment_id, st.student_id, i + 1) })),
                final: f ? String(f.grade) : '',
                acredita: f ? (f.passed ? 'SÍ' : 'NO') : '',
            }
        }),
    }))
    return {
        carrera: head.carrera, grupo: head.grupo, semestre: head.semestre ?? '',
        periodo: head.periodo, tutor: head.tutor, materias, estudiantes,
    }
}

/** Descarga el formato oficial (DOCX) del reporteador, alimentado por este endpoint. */
async function downloadOficial() {
    if (!subjects.value.length) return
    generating.value = true
    try {
        await reportGen.downloadFromContext({
            reportCode: 'RPT.TUT_SEGUIMIENTO_TRAYECTORIA',
            context: buildReportContext(),
            filename: `trayectoria-${head.grupo || 'grupo'}`,
        })
    } catch (e: any) {
        if (e?.notAvailable) toast.error('El formato oficial aún no tiene plantilla cargada en el reporteador. Avisa a Servicios Escolares/TI.')
        else toast.error(e?.response?.data?.message ?? e?.message ?? 'No se pudo generar el formato.')
    } finally { generating.value = false }
}

onMounted(load)
</script>
