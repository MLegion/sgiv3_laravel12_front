<template>
    <div class="p-4 md:p-6 max-w-[1600px] mx-auto">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-1">
            <h1 class="text-xl font-semibold text-slate-800">Seguimiento de la trayectoria académica</h1>
            <div class="flex items-center gap-2">
                <button @click="$router.back()" class="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50">← Volver</button>
                <span v-if="syncing" class="text-xs text-indigo-500 flex items-center gap-1">Sincronizando con Mi Docencia…</span>
                <button v-if="editable" @click="save" :disabled="saving || !dirty || !subjects.length"
                    class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5">
                    {{ saving ? 'Guardando…' : 'Guardar' }}
                </button>
                <button @click="downloadOficial" :disabled="generating || !subjects.length"
                    class="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6M9 17h3"/></svg>
                    {{ generating ? 'Generando…' : 'Formato oficial' }}
                </button>
            </div>
        </div>
        <p class="text-sm text-slate-500 mb-2">
            <span v-if="head.carrera"><b>Carrera:</b> {{ head.carrera }} · </span>
            <span v-if="head.grupo"><b>Grupo:</b> {{ head.grupo }} · </span>
            <span v-if="head.semestre"><b>Semestre:</b> {{ head.semestre }} · </span>
            <span v-if="head.periodo"><b>Periodo:</b> {{ head.periodo }} · </span>
            <span v-if="head.tutor"><b>Tutor(a):</b> {{ head.tutor }}</span>
        </p>

        <SkeletonTable v-if="loading" :rows="6" :cols="8" />
        <div v-else-if="!students.length" class="text-sm text-slate-500">
            Este grupo no tiene tutorados sincronizados todavía.
        </div>
        <div v-else-if="!subjects.length" class="text-sm text-slate-500">
            El grupo no tiene materias con carga en este periodo.
        </div>

        <template v-else>
            <p class="text-xs mb-2" :class="locked ? 'text-rose-600' : (midocenciaActive ? 'text-slate-400' : 'text-amber-600')">
                <template v-if="locked">
                    La trayectoria ya fue <b>entregada</b>: quedó bloqueada. Pide a la coordinación regresarla a borrador para editarla.
                </template>
                <template v-else-if="midocenciaActive">
                    Las calificaciones se <b>sincronizan automáticamente con Mi Docencia</b> al entrar (por unidad y final). Vista de solo lectura.
                </template>
                <template v-else>
                    Mi Docencia no está activo en este plantel: captura aquí las calificaciones por unidad y la final de cada
                    tutorado y presiona <b>Guardar</b>.
                </template>
            </p>
            <div role="region" aria-label="Trayectoria académica" tabindex="0" class="overflow-x-auto rounded-xl border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400">
                <table class="text-xs border-collapse">
                    <caption class="sr-only">Trayectoria académica</caption>
                    <thead class="bg-slate-50 text-slate-600">
                        <tr>
                            <th scope="col" rowspan="2" class="px-2 py-2 text-left sticky left-0 bg-slate-50 border-r border-slate-200 z-10">No. Control</th>
                            <th scope="col" rowspan="2" class="px-2 py-2 text-left sticky left-[86px] bg-slate-50 border-r border-slate-200 z-10 min-w-[200px]">Alumno</th>
                            <th scope="col" v-for="s in subjects" :key="s.teacher_assignment_id" :colspan="s.units_count + 1"
                                class="px-2 py-1 text-center border-l border-slate-300">
                                <div class="font-semibold truncate max-w-[220px] mx-auto">{{ s.materia }}</div>
                                <div class="font-normal text-[10px] text-slate-400 truncate max-w-[220px] mx-auto">{{ s.docente || 'Sin docente' }}</div>
                            </th>
                        </tr>
                        <tr>
                            <template v-for="s in subjects" :key="'u' + s.teacher_assignment_id">
                                <th scope="col" v-for="u in s.units_count" :key="s.teacher_assignment_id + '-' + u"
                                    class="px-1.5 py-1 text-center font-medium border-l border-slate-200 w-10">{{ roman(u) }}</th>
                                <th scope="col" class="px-1.5 py-1 text-center font-semibold border-l border-slate-300 bg-slate-100 w-12">FIN</th>
                            </template>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="st in students" :key="st.student_id" class="hover:bg-slate-50/60">
                            <td class="px-2 py-1 font-mono sticky left-0 bg-white border-r border-slate-200">{{ st.num_control }}</td>
                            <td class="px-2 py-1 sticky left-[86px] bg-white border-r border-slate-200 whitespace-nowrap">{{ st.nombre }}</td>
                            <template v-for="s in subjects" :key="st.student_id + '-' + s.teacher_assignment_id">
                                <td v-for="u in s.units_count" :key="st.student_id + '-' + s.teacher_assignment_id + '-' + u"
                                    class="px-0.5 py-0.5 text-center border-l border-slate-100">
                                    <input :value="cell(s.teacher_assignment_id, st.student_id, u)"
                                        @input="setCell(s.teacher_assignment_id, st.student_id, u, $event)"
                                        :readonly="!editable" inputmode="decimal"
                                        :aria-label="`${st.nombre} — ${s.materia} — unidad ${roman(u)}`"
                                        class="w-10 text-center tabular-nums rounded text-xs px-0.5 py-0.5"
                                        :class="editable ? 'border-slate-200 focus:border-teal-400 focus:ring-teal-300' : 'border-transparent bg-transparent'" />
                                </td>
                                <td class="px-0.5 py-0.5 text-center border-l border-slate-300 bg-slate-50/70">
                                    <input :value="cell(s.teacher_assignment_id, st.student_id, 0)"
                                        @input="setCell(s.teacher_assignment_id, st.student_id, 0, $event)"
                                        :readonly="!editable" inputmode="decimal"
                                        :aria-label="`${st.nombre} — ${s.materia} — calificación final`"
                                        class="w-11 text-center tabular-nums font-semibold rounded text-xs px-0.5 py-0.5"
                                        :class="[finalClass(s.teacher_assignment_id, st.student_id), editable ? 'border-slate-200 focus:border-teal-400 focus:ring-teal-300' : 'border-transparent bg-transparent']" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import SkeletonTable from '@/app/components/ui/SkeletonTable.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useConfirm } from '@/app/composables/useConfirm'
import { useReportGenerator } from '@/modules/reports/composables/useReportGenerator'

const props = defineProps<{ id: string | number }>()
const toast = useToast()
const { confirm } = useConfirm()
const T = API.TUTORING_API
const reportGen = useReportGenerator()

interface Subject { teacher_assignment_id: number; subject_id: number; materia: string; official_code?: string | null; docente?: string | null; units_count: number; target_semester?: number | null }
interface Student { student_id: number; num_control: string; nombre: string }

const loading = ref(false)
const generating = ref(false)
const saving = ref(false)
const syncing = ref(false)
const dirty = ref(false)
const midocenciaActive = ref(false)
const locked = ref(false)
const editable = computed(() => !midocenciaActive.value && !locked.value)
const subjects = ref<Subject[]>([])
const students = ref<Student[]>([])
// Mapa editable de celdas: `${ta}:${sid}:${un}` → texto. un=0 es la final.
const grades = reactive<Record<string, string>>({})
const head = reactive<{ tutor: string; carrera: string; grupo: string; periodo: string; semestre: number | null }>(
    { tutor: '', carrera: '', grupo: '', periodo: '', semestre: null })

function keyOf(ta: number, sid: number, un: number) { return `${ta}:${sid}:${un}` }
function cell(ta: number, sid: number, un: number): string { return grades[keyOf(ta, sid, un)] ?? '' }
function setCell(ta: number, sid: number, un: number, e: Event) {
    grades[keyOf(ta, sid, un)] = (e.target as HTMLInputElement).value
    dirty.value = true
}
function finalClass(ta: number, sid: number): string {
    const v = grades[keyOf(ta, sid, 0)]
    if (v === undefined || v === '') return 'text-slate-600'
    const n = Number(v)
    if (Number.isNaN(n)) return 'text-slate-600'
    return n >= 70 ? 'text-emerald-600' : 'text-rose-600'
}

// 1→I, 2→II… (hasta cubrir el nº de unidades de cualquier materia).
function roman(n: number): string {
    const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
    let r = '', x = n
    for (const [v, s] of map) while (x >= v) { r += s; x -= v }
    return r || '·'
}

/** Vuelca units/finals del backend al mapa editable. */
function fillGrades(units: any, finals: any) {
    for (const k of Object.keys(grades)) delete grades[k]
    for (const ta of Object.keys(units ?? {})) {
        for (const sid of Object.keys(units[ta])) {
            for (const un of Object.keys(units[ta][sid])) {
                const g = units[ta][sid][un]?.grade
                if (g != null) grades[keyOf(Number(ta), Number(sid), Number(un))] = fmt(g)
            }
        }
    }
    for (const ta of Object.keys(finals ?? {})) {
        for (const sid of Object.keys(finals[ta])) {
            const g = finals[ta][sid]?.grade
            if (g != null) grades[keyOf(Number(ta), Number(sid), 0)] = fmt(g)
        }
    }
}
function fmt(g: number): string { return Number.isInteger(g) ? String(g) : Number(g).toFixed(1) }

async function load(autosync = true) {
    loading.value = true
    try {
        const { data } = await api.get(T.assignments.trayectoria(props.id))
        subjects.value = data.subjects ?? []
        students.value = data.students ?? []
        midocenciaActive.value = !!data.midocencia_active
        locked.value = !!data.locked

        // Con Mi Docencia activo: sincroniza SOLO al entrar (fija lo de los docentes) y recarga.
        if (autosync && midocenciaActive.value && !locked.value && subjects.value.length && students.value.length) {
            syncing.value = true
            try {
                await api.post(T.assignments.trayectoriaExtract(props.id))
                return await load(false)
            } catch { /* si falla la sync, se muestra lo que haya */ }
            finally { syncing.value = false }
        }

        fillGrades(data.units ?? {}, data.finals ?? {})
        dirty.value = false
        head.tutor = data.header?.tutor ?? ''
        head.carrera = data.header?.carrera ?? ''
        head.grupo = data.header?.grupo ?? ''
        head.periodo = data.header?.periodo ?? ''
        head.semestre = data.header?.semestre ?? null
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar la trayectoria.') }
    finally { loading.value = false }
}

/** Arma el payload de TODAS las celdas de la matriz (vacías → null para borrarlas). */
function buildPayload() {
    const rows: { student_id: number; teacher_assignment_id: number; unit_number: number; grade: number | null }[] = []
    for (const s of subjects.value) {
        for (const st of students.value) {
            for (let u = 1; u <= s.units_count; u++) {
                const v = grades[keyOf(s.teacher_assignment_id, st.student_id, u)]
                rows.push({ student_id: st.student_id, teacher_assignment_id: s.teacher_assignment_id, unit_number: u, grade: toNum(v) })
            }
            const f = grades[keyOf(s.teacher_assignment_id, st.student_id, 0)]
            rows.push({ student_id: st.student_id, teacher_assignment_id: s.teacher_assignment_id, unit_number: 0, grade: toNum(f) })
        }
    }
    return rows
}
function toNum(v: string | undefined): number | null {
    if (v === undefined || v === '') return null
    const n = Number(v)
    return Number.isNaN(n) ? null : n
}

async function save() {
    saving.value = true
    try {
        await api.post(T.assignments.trayectoria(props.id), { grades: buildPayload() })
        dirty.value = false
        toast.success('Trayectoria guardada.')
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo guardar la trayectoria.') }
    finally { saving.value = false }
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
            const f = grades[keyOf(s.teacher_assignment_id, st.student_id, 0)]
            const fn = toNum(f)
            return {
                unidades: Array.from({ length: s.units_count }, (_, i) => ({ v: grades[keyOf(s.teacher_assignment_id, st.student_id, i + 1)] ?? '' })),
                final: fn != null ? String(fn) : '',
                acredita: fn != null ? (fn >= 70 ? 'SÍ' : 'NO') : '',
            }
        }),
    }))
    return {
        carrera: head.carrera, grupo: head.grupo, semestre: head.semestre ?? '',
        periodo: head.periodo, tutor: head.tutor, materias, estudiantes,
    }
}

/** Descarga el formato oficial (DOCX) del reporteador. */
async function downloadOficial() {
    if (!subjects.value.length) return
    if (dirty.value && !await confirm({ title: 'Continuar sin guardar', message: 'Tienes cambios sin guardar; el formato usará lo que ves. ¿Continuar sin guardar?', confirmText: 'Continuar', variant: 'warning' })) return
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
