<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
                <p class="text-[11px] uppercase tracking-wider text-slate-400">Instrumentación didáctica</p>
                <input
                    v-model="header.title"
                    :placeholder="defaultTitle || 'Título de la instrumentación'"
                    class="w-full bg-transparent text-xl font-semibold text-slate-800 border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none focus:ring-0 px-0 py-0.5"
                />
                <p v-if="header.studyProgram" class="text-xs text-slate-500 mt-0.5">
                    {{ header.studyProgram.claveNormalized }} · {{ header.studyProgram.name }}
                </p>
            </div>
            <div class="flex items-center gap-3">
                <!-- Estado de la instrumentación -->
                <span class="text-xs font-semibold px-2 py-1 rounded-full"
                    :class="{
                        'bg-slate-100 text-slate-600': status === 'draft',
                        'bg-amber-100 text-amber-700': status === 'submitted',
                        'bg-green-100 text-green-700': status === 'approved',
                        'bg-red-100 text-red-700': status === 'rejected',
                    }">{{ statusLabel }}</span>

                <!-- Estado de guardado (autosave) -->
                <span class="text-xs flex items-center gap-1.5"
                    :class="{
                        'text-slate-400': saveState === 'idle',
                        'text-amber-600': saveState === 'saving',
                        'text-emerald-600': saveState === 'saved',
                        'text-red-600': saveState === 'error',
                    }">
                    <svg v-if="saveState === 'saving'" class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span v-else-if="saveState === 'saved'">✓</span>
                    <span v-else-if="saveState === 'error'">⚠</span>
                    {{ saveLabel }}
                </span>

                <button type="button" class="px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" @click="goBack">Volver</button>
            </div>
        </div>

        <div v-if="header.studyProgramId && programApprovalStatus && programApprovalStatus !== 'approved'"
            class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
            ⚠ El programa de estudio de esta materia aún no está aprobado (estado: <span class="font-medium">{{ programStatusLabel }}</span>). La instrumentación se pre-llenó con su contenido actual; podría cambiar al aprobarse.
        </div>

        <div v-if="loading" class="text-sm text-slate-500">Cargando…</div>

        <div v-else-if="!header.studyProgramId" class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            Esta materia no tiene un programa de estudio digitalizado, por lo que no se puede pre-llenar la instrumentación.
        </div>

        <Tabs v-else v-model="activeTab" :tabs="tabs">
            <!-- PORTADA -->
            <template v-if="activeTab === 'portada'">
                <div class="space-y-4 text-sm">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <ReadField label="Asignatura" :value="header.studyProgram?.name" />
                        <ReadField label="Clave" :value="header.studyProgram?.claveNormalized" />
                        <ReadField label="Horas T-P-Créditos" :value="satcaText" />
                    </div>
                    <div>
                        <label class="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">1. Caracterización de la asignatura</label>
                        <textarea v-model="header.caracterizacion" rows="10" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea>
                    </div>
                </div>
            </template>

            <!-- INTENCIÓN -->
            <template v-else-if="activeTab === 'intencion'">
                <label class="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">2. Intención didáctica</label>
                <textarea v-model="header.intencion_didactica" rows="14" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea>
            </template>

            <!-- COMPETENCIAS -->
            <template v-else-if="activeTab === 'competencias'">
                <div class="space-y-4">
                    <Field label="3.1 Competencias previas"><textarea v-model="header.competencias_previas" rows="4" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea></Field>
                    <Field label="3.2 Competencias genéricas">
                        <textarea v-model="header.competencias_genericas" rows="6" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea>
                        <div v-if="programGenericas.length" class="mt-2 text-xs border border-slate-200 rounded p-2 bg-slate-50">
                            <p class="text-slate-500 mb-1.5">Genéricas del programa de estudio (clic para agregar):</p>
                            <div v-for="grp in programGenericas" :key="grp.typeId" class="mb-2 last:mb-0">
                                <span class="font-medium text-slate-600">{{ grp.typeName }}</span>
                                <div class="flex flex-wrap gap-1 mt-1">
                                    <button :aria-label="genericaInText(c.description) ? 'Ya agregada' : 'Agregar'" v-for="c in grp.items" :key="c.id" type="button"
                                        class="px-2 py-0.5 rounded-full border text-left transition"
                                        :class="genericaInText(c.description)
                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                            : 'border-slate-300 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300'"
                                        :title="genericaInText(c.description) ? 'Ya agregada' : 'Agregar'"
                                        @click="addGenericaToText(c.description)">
                                        + {{ c.description }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Field>
                    <Field label="3.3 Competencias específicas de la asignatura"><textarea v-model="header.competencia_especifica_override" rows="4" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea></Field>
                </div>
            </template>

            <!-- UNIDAD N — FRENTE -->
            <template v-else-if="activeUnit !== null && activeUnitSide === 'front'">
                <section class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-semibold text-slate-700">Unidad {{ activeUnit.number }} — Frente</h3>
                        <button type="button" class="text-xs text-red-500 hover:text-red-700" @click="removeUnit(activeUnitIndex)">✕ Eliminar unidad</button>
                    </div>
                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-2"><FormInput label="Competencia N°" type="number" v-model="activeUnit.number" /></div>
                        <div class="col-span-10"><FormInput label="Nombre de la competencia" v-model="activeUnit.title" /></div>
                    </div>
                    <Field label="Descripción"><textarea v-model="activeUnit.competenciaDescripcion" rows="2" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea></Field>
                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-6">
                            <Field label="Temas y subtemas"><textarea v-model="activeUnit.temasSubtemas" rows="8" class="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"></textarea></Field>
                        </div>
                        <div class="col-span-6">
                            <Field label="Desarrollo de competencias genéricas"><textarea v-model="activeUnit.competenciasGenericas" rows="8" class="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"></textarea></Field>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <ActivityList title="Actividades de aprendizaje" :items="activeUnit.learningActivities" />
                        <ActivityList title="Actividades de enseñanza" :items="activeUnit.teachingActivities" />
                    </div>
                    <div class="grid grid-cols-4 gap-3">
                        <FormInput label="Horas teóricas" type="number" v-model="activeUnit.hoursT" />
                        <FormInput label="Horas prácticas" type="number" v-model="activeUnit.hoursP" />
                        <FormInput label="Inicio" type="date" v-model="activeUnit.startDate" />
                        <FormInput label="Fin" type="date" v-model="activeUnit.endDate" />
                    </div>
                </section>
            </template>

            <!-- UNIDAD N — ATRÁS -->
            <template v-else-if="activeUnit !== null && activeUnitSide === 'back'">
                <section class="space-y-3">
                    <h3 class="text-sm font-semibold text-slate-700">Unidad {{ activeUnit.number }} — Atrás (evaluación)</h3>

                    <Field label="Indicadores de alcance">
                            <div class="overflow-x-auto w-full"><table class="w-full text-xs border border-slate-200">
                                <thead class="bg-slate-50"><tr><th scope="col" class="border px-2 py-1 w-8"></th><th scope="col" class="border px-2 py-1 text-left">Indicador</th><th scope="col" class="border px-2 py-1 w-20">Valor</th></tr></thead>
                                <tbody>
                                    <tr v-for="ind in activeUnit.indicadores" :key="ind.letter">
                                        <td class="border px-2 py-1 text-center font-semibold uppercase">{{ ind.letter }}</td>
                                        <td class="border px-1 py-1"><input v-model="ind.description" class="w-full px-1 py-0.5 border border-slate-200 rounded text-xs" /></td>
                                        <td class="border px-1 py-1"><input v-model.number="ind.value" type="number" class="w-full px-1 py-0.5 border border-slate-200 rounded text-xs text-center" /></td>
                                    </tr>
                                </tbody>
                            </table></div>
                        </Field>

                        <Field label="Matriz de evaluación">
                            <div class="overflow-x-auto w-full"><table class="w-full text-xs border border-slate-200">
                                <thead class="bg-slate-50">
                                    <tr>
                                        <th scope="col" class="border px-2 py-1 text-left">Evidencia de aprendizaje</th>
                                        <th scope="col" class="border px-2 py-1 w-14">%</th>
                                        <th scope="col" v-for="ind in activeUnit.indicadores" :key="ind.letter" class="border px-1 py-1 w-7 uppercase">{{ ind.letter }}</th>
                                        <th scope="col" class="border px-2 py-1 text-left">Instrumento</th>
                                        <th scope="col" class="border px-1 py-1 w-7"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(ev, ei) in unitEvidences(activeUnit.number)" :key="ei">
                                        <td class="border px-1 py-1"><input v-model="ev.evidence" class="w-full px-1 py-0.5 border border-slate-200 rounded text-xs" /></td>
                                        <td class="border px-1 py-1"><input v-model.number="ev.weight" type="number" class="w-full px-1 py-0.5 border border-slate-200 rounded text-xs text-center" /></td>
                                        <td v-for="ind in activeUnit.indicadores" :key="ind.letter" class="border px-1 py-1 text-center">
                                            <input type="checkbox" :checked="ev.indicators.includes(ind.letter)" @change="toggleIndicator(ev, ind.letter)" />
                                        </td>
                                        <td class="border px-1 py-1"><input v-model="ev.instrumentLabel" class="w-full px-1 py-0.5 border border-slate-200 rounded text-xs" /></td>
                                        <td class="border px-1 py-1 text-center"><button type="button" class="text-red-400 hover:text-red-600" @click="removeEvidence(ev)">✕</button></td>
                                    </tr>
                                </tbody>
                            </table></div>
                            <div class="flex items-center justify-between mt-1">
                                <button type="button" class="text-xs text-blue-600" @click="addEvidence(activeUnit.number)">+ Evidencia</button>
                                <span class="text-xs" :class="unitWeight(activeUnit.number) === 100 ? 'text-emerald-600' : 'text-slate-500'">Total unidad: {{ unitWeight(activeUnit.number) }}%</span>
                            </div>
                        </Field>
                </section>
            </template>

            <!-- CALENDARIO -->
            <template v-else-if="activeTab === 'fechas'">
                <div v-if="header.teacher_assignment_id">
                    <CalendarizacionView :teacher-assignment-id="Number(header.teacher_assignment_id)" />
                </div>
                <div v-else class="text-sm text-slate-500">Selecciona una asignación para ver sus fechas de clase.</div>
            </template>

            <template v-else-if="activeTab === 'calendario'">
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-semibold text-slate-700">Calendarización de evaluación</h3>
                        <button type="button" class="text-xs text-blue-600" @click="addWeek">+ Semana</button>
                    </div>
                    <div class="overflow-x-auto w-full"><table class="w-full text-xs border border-slate-200">
                        <thead class="bg-slate-50"><tr><th scope="col" class="border px-2 py-1 w-16">Semana</th><th scope="col" class="border px-2 py-1 w-16">Unidad</th><th scope="col" class="border px-2 py-1">Del</th><th scope="col" class="border px-2 py-1">Al</th><th scope="col" class="border px-2 py-1 w-16">T.P.</th><th scope="col" class="border px-2 py-1 w-16">T.R.</th><th scope="col" class="border px-2 py-1 w-16">S.D.</th><th scope="col" class="border px-1 py-1 w-7"></th></tr></thead>
                        <tbody>
                            <tr v-for="(w, wi) in header.calendar" :key="wi">
                                <td class="border px-1 py-1"><input v-model.number="w.week" type="number" class="w-full px-1 py-0.5 border border-slate-200 rounded text-center" /></td>
                                <td class="border px-1 py-1"><input v-model.number="w.unitNumber" type="number" class="w-full px-1 py-0.5 border border-slate-200 rounded text-center" /></td>
                                <td class="border px-1 py-1"><input v-model="w.from" type="date" class="w-full px-1 py-0.5 border border-slate-200 rounded" /></td>
                                <td class="border px-1 py-1"><input v-model="w.to" type="date" class="w-full px-1 py-0.5 border border-slate-200 rounded" /></td>
                                <td class="border px-1 py-1"><input v-model="w.tp" class="w-full px-1 py-0.5 border border-slate-200 rounded text-center" /></td>
                                <td class="border px-1 py-1"><input v-model="w.tr" class="w-full px-1 py-0.5 border border-slate-200 rounded text-center" /></td>
                                <td class="border px-1 py-1"><input v-model="w.sd" class="w-full px-1 py-0.5 border border-slate-200 rounded text-center" /></td>
                                <td class="border px-1 py-1 text-center"><button type="button" class="text-red-400 hover:text-red-600" @click="header.calendar.splice(wi, 1)">✕</button></td>
                            </tr>
                        </tbody>
                    </table></div>
                    <div class="w-56"><FormInput label="Fecha de elaboración" type="date" v-model="header.elaborated_at" /></div>
                </div>
            </template>

            <!-- FUENTES -->
            <template v-else-if="activeTab === 'fuentes'">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-8 space-y-2">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-semibold text-slate-700">Fuentes de información</h3>
                            <button type="button" class="text-xs text-blue-600" @click="header.fuentes.push({ reference: '', type: null })">+ Fuente</button>
                        </div>
                        <div v-for="(f, fi) in header.fuentes" :key="fi" class="flex gap-2 items-center">
                            <input v-model="f.reference" class="flex-1 px-2 py-1 text-sm border border-slate-300 rounded" placeholder="Referencia bibliográfica" />
                            <button type="button" class="text-red-400 hover:text-red-600 text-xs" @click="header.fuentes.splice(fi, 1)">✕</button>
                        </div>
                    </div>
                    <div class="col-span-4 space-y-2">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-semibold text-slate-700">Apoyos didácticos</h3>
                            <button type="button" class="text-xs text-blue-600" @click="header.apoyos_didacticos.push('')">+ Apoyo</button>
                        </div>
                        <div v-for="(apoyo, ai) in header.apoyos_didacticos" :key="ai" class="flex gap-2 items-center">
                            <input :value="apoyo" @input="header.apoyos_didacticos[ai] = ($event.target as HTMLInputElement).value" class="flex-1 px-2 py-1 text-sm border border-slate-300 rounded" />
                            <button type="button" class="text-red-400 hover:text-red-600 text-xs" @click="header.apoyos_didacticos.splice(ai, 1)">✕</button>
                        </div>
                    </div>
                </div>
            </template>
        </Tabs>

        <div v-if="header.studyProgramId" class="flex justify-end">
            <button type="button" class="text-xs text-blue-600 hover:text-blue-800" @click="addUnit">+ Agregar unidad</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import Tabs from '@/app/components/ui/Tabs.vue'
import CalendarizacionView from '@/modules/teaching/components/CalendarizacionView.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const route = useRoute()
const router = useRouter()

const instId = ref<number | null>(route.params.id ? Number(route.params.id) : null)
const isEdit = computed(() => instId.value !== null)

const loading = ref(true)
const activeTab = ref('portada')

// Autoguardado: estado + maquinaria de debounce.
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const status = ref<string>('draft')   // estado de la instrumentación (draft/submitted/...)
const ready = ref(false)              // true tras la carga inicial: habilita el autoguardado
let saveTimer: ReturnType<typeof setTimeout> | null = null
let savingNow = false                 // hay un guardado en curso
let pendingChanges = false            // llegaron cambios mientras se guardaba

const saveLabel = computed(() => ({
    idle: '', saving: 'Guardando…', saved: 'Guardado', error: 'Error al guardar',
}[saveState.value]))
const statusLabel = computed(() => ({
    draft: 'BORRADOR', submitted: 'EN REVISIÓN', approved: 'APROBADA', rejected: 'RECHAZADA',
}[status.value] ?? status.value))

const header = reactive<any>({
    teacher_assignment_id: (route.query.teacher_assignment_id as string) ?? '',
    study_program_id: null,
    studyProgramId: null,
    studyProgram: null,
    title: '',
    caracterizacion: '',
    intencion_didactica: '',
    competencias_previas: '',
    competencias_genericas: '',
    competencia_especifica_override: '',
    satca: { t: null, p: null, c: null },
    fuentes: [] as any[],
    apoyos_didacticos: [] as string[],
    calendar: [] as any[],
    elaborated_at: '',
})

const units = ref<any[]>([])
const evaluationItems = ref<any[]>([])

// Genéricas del programa de estudio (catálogo, agrupadas por tipo) para agregarlas al textarea.
const programGenericas = ref<any[]>([])

// Título por defecto (materia · campus · tipo de modalidad · periodo), del backend.
const defaultTitle = ref('')

// Estado de aprobación del programa de estudio del que se sembró (informativo).
const programApprovalStatus = ref<string | null>(null)
const programStatusLabel = computed(() => ({
    draft: 'Borrador', pending: 'En revisión', rejected: 'Rechazado', approved: 'Aprobado',
}[programApprovalStatus.value ?? ''] ?? programApprovalStatus.value))

function genericaInText(desc: string): boolean {
    return (header.competencias_genericas || '').includes(desc)
}
function addGenericaToText(desc: string): void {
    if (genericaInText(desc)) return
    const cur = (header.competencias_genericas || '').trim()
    header.competencias_genericas = cur ? cur + ' • ' + desc : '• ' + desc
}

const satcaText = computed(() => `${header.satca?.t ?? '?'}-${header.satca?.p ?? '?'}-${header.satca?.c ?? '?'}`)

const tabs = computed(() => [
    { key: 'portada', label: 'Portada' },
    { key: 'intencion', label: 'Intención' },
    { key: 'competencias', label: 'Competencias' },
    // Cada unidad se parte en dos pestañas (como el Excel TecNM): frente y atrás.
    ...units.value.flatMap((_, i) => [
        { key: `unit-${i}-front`, label: `Unidad ${units.value[i].number} · Frente` },
        { key: `unit-${i}-back`, label: `Unidad ${units.value[i].number} · Atrás` },
    ]),
    { key: 'fechas', label: 'Fechas' },
    { key: 'calendario', label: 'Calendario' },
    { key: 'fuentes', label: 'Fuentes' },
])

const unitTabMatch = computed(() => activeTab.value.match(/^unit-(\d+)-(front|back)$/))
const activeUnitIndex = computed(() => (unitTabMatch.value ? Number(unitTabMatch.value[1]) : -1))
const activeUnitSide = computed<'front' | 'back' | null>(() => (unitTabMatch.value ? (unitTabMatch.value[2] as 'front' | 'back') : null))
const activeUnit = computed(() => (activeUnitIndex.value >= 0 ? units.value[activeUnitIndex.value] : null))

function unitEvidences(unitNumber: number) {
    return evaluationItems.value.filter((e) => e.unitNumber === unitNumber)
}
function unitWeight(unitNumber: number) {
    return unitEvidences(unitNumber).reduce((acc, e) => acc + (Number(e.weight) || 0), 0)
}
function addEvidence(unitNumber: number) {
    evaluationItems.value.push({ evidence: '', weight: 0, unitNumber, instrumentLabel: '', indicators: [] })
}
function removeEvidence(ev: any) {
    const i = evaluationItems.value.indexOf(ev)
    if (i >= 0) evaluationItems.value.splice(i, 1)
}
function toggleIndicator(ev: any, letter: string) {
    const i = ev.indicators.indexOf(letter)
    if (i >= 0) ev.indicators.splice(i, 1)
    else ev.indicators.push(letter)
}

function newUnit(n: number) {
    return {
        number: n, title: '', competenciaDescripcion: '', temasSubtemas: '', competenciasGenericas: '',
        hoursT: 0, hoursP: 0, startDate: '', endDate: '', studyProgramTemaId: null,
        learningActivities: [] as any[], teachingActivities: [] as any[],
        indicadores: [], nivelesDesempeno: [],
    }
}
function addUnit() {
    units.value.push(newUnit(units.value.length + 1))
    activeTab.value = `unit-${units.value.length - 1}-front`
}
function removeUnit(i: number) {
    units.value.splice(i, 1)
    activeTab.value = 'portada'
}
function addWeek() {
    header.calendar.push({ week: header.calendar.length + 1, unitNumber: null, from: '', to: '', tp: '', tr: '', sd: '' })
}

function hydrate(data: any) {
    header.study_program_id = data.studyProgramId ?? null
    header.studyProgramId = data.studyProgramId ?? null
    header.studyProgram = data.studyProgram ?? null
    if (data.defaultTitle) defaultTitle.value = data.defaultTitle
    header.title = data.title ?? ''
    // Sin título guardado: pre-llenar con el default (materia · campus · modalidad · periodo).
    if (!header.title && defaultTitle.value) header.title = defaultTitle.value
    header.caracterizacion = data.caracterizacion ?? ''
    header.intencion_didactica = data.intencionDidactica ?? ''
    header.competencias_previas = data.competenciasPrevias ?? ''
    header.competencias_genericas = data.competenciasGenericas ?? ''
    header.competencia_especifica_override = data.competenciaEspecificaOverride ?? ''
    if (Array.isArray(data.programGenericCompetencies)) programGenericas.value = data.programGenericCompetencies
    if (data.programApprovalStatus !== undefined && data.programApprovalStatus !== null) programApprovalStatus.value = data.programApprovalStatus
    header.satca = data.satca ?? { t: null, p: null, c: null }
    header.fuentes = (data.fuentes ?? []).map((f: any) => ({ reference: f.reference ?? '', type: f.type ?? null }))
    header.apoyos_didacticos = data.apoyosDidacticos ?? []
    header.calendar = data.calendar ?? []
    header.elaborated_at = data.elaboratedAt ?? ''
    units.value = (data.units ?? []).map((u: any) => ({
        id: u.id ?? null,
        number: u.number, title: u.title ?? '', competenciaDescripcion: u.competenciaDescripcion ?? '',
        temasSubtemas: u.temasSubtemas ?? '', competenciasGenericas: u.competenciasGenericas ?? '',
        hoursT: u.hoursT ?? 0, hoursP: u.hoursP ?? 0, startDate: u.startDate ?? '', endDate: u.endDate ?? '',
        studyProgramTemaId: u.studyProgramTemaId ?? null,
        learningActivities: (u.learningActivities ?? []).map((a: any) => ({ description: a.description })),
        teachingActivities: (u.teachingActivities ?? []).map((a: any) => ({ description: a.description })),
        indicadores: (u.indicadores ?? []).map((x: any) => ({ ...x })),
        nivelesDesempeno: (u.nivelesDesempeno ?? []).map((x: any) => ({ ...x })),
    }))
    evaluationItems.value = (data.evaluationItems ?? []).map((e: any) => ({
        evidence: e.evidence ?? '', weight: Number(e.weight) || 0,
        unitNumber: e.unitNumber ?? unitNumberByUnitId(e.instrumentationUnitId) ?? null,
        instrumentLabel: e.instrumentLabel ?? '', indicators: e.indicators ?? [],
    }))
}

// En edición, el item trae instrumentationUnitId; mapearlo a number de unidad.
function unitNumberByUnitId(unitId: number | null): number | null {
    if (unitId == null) return null
    const u = (units.value ?? []).find((x: any) => x.id === unitId)
    return u ? u.number : null
}

async function loadById(id: number): Promise<void> {
    const { data } = await api.get(API.TEACHING_API.instrumentations.byId(id))
    instId.value = id
    header.teacher_assignment_id = data.teacherAssignmentId ?? header.teacher_assignment_id
    status.value = data.status ?? 'draft'
    hydrate(data)
    saveState.value = 'saved'
}

/** byId no trae el catálogo de genéricas del programa; lo tomamos del seed (best-effort). */
async function loadGenericasFallback(): Promise<void> {
    if (programGenericas.value.length || !header.teacher_assignment_id) return
    try {
        const seed = await api.get(API.TEACHING_API.instrumentations.seed(header.teacher_assignment_id))
        if (Array.isArray(seed.data?.programGenericCompetencies)) programGenericas.value = seed.data.programGenericCompetencies
        if (seed.data?.programApprovalStatus) programApprovalStatus.value = seed.data.programApprovalStatus
        if (seed.data?.defaultTitle) {
            defaultTitle.value = seed.data.defaultTitle
            if (!header.title) header.title = seed.data.defaultTitle
        }
    } catch { /* sin permiso/seed: se omite el listado */ }
}

onMounted(async () => {
    loading.value = true
    try {
        if (isEdit.value) {
            await loadById(instId.value!)
            await loadGenericasFallback()
        } else {
            // ¿Ya existe una instrumentación para esta asignación? Adoptarla (no duplicar).
            let existing: any[] = []
            try {
                const res = await api.get(API.TEACHING_API.instrumentations.list, {
                    params: { teacher_assignment_id: header.teacher_assignment_id },
                })
                existing = res.data?.items ?? (Array.isArray(res.data) ? res.data : [])
            } catch { /* ignora: seguimos a crear */ }

            if (existing.length) {
                await loadById(Number(existing[0].id))
                await loadGenericasFallback()
            } else {
                const { data } = await api.get(API.TEACHING_API.instrumentations.seed(header.teacher_assignment_id))
                hydrate(data)
                // Crea el registro de inmediato (aunque "vacío") con lo que el seed pre-llenó.
                if (header.studyProgramId) {
                    await persistNow()
                }
            }
        }
    } finally {
        loading.value = false
        // Habilita el autoguardado sólo tras la carga inicial.
        ready.value = true
        watch([header, units, evaluationItems], scheduleSave, { deep: true })
    }
})

onBeforeUnmount(() => {
    if (saveTimer) { clearTimeout(saveTimer); void persistNow() }
})

function buildPayload(): any {
    return {
        teacher_assignment_id: header.teacher_assignment_id ? Number(header.teacher_assignment_id) : null,
        study_program_id: header.study_program_id ? Number(header.study_program_id) : null,
        title: header.title || null,
        caracterizacion: header.caracterizacion || null,
        intencion_didactica: header.intencion_didactica || null,
        competencias_previas: header.competencias_previas || null,
        competencias_genericas: header.competencias_genericas || null,
        competencia_especifica_override: header.competencia_especifica_override || null,
        fuentes: header.fuentes.filter((f: any) => f.reference),
        apoyos_didacticos: header.apoyos_didacticos.filter((a: string) => a),
        calendar: header.calendar,
        elaborated_at: header.elaborated_at || null,
        units: units.value.map((u: any, i: number) => ({
            number: Number(u.number) || i + 1,
            title: u.title,
            competenciaDescripcion: u.competenciaDescripcion || null,
            temasSubtemas: u.temasSubtemas || null,
            competenciasGenericas: u.competenciasGenericas || null,
            studyProgramTemaId: u.studyProgramTemaId,
            hoursT: Number(u.hoursT) || 0,
            hoursP: Number(u.hoursP) || 0,
            startDate: u.startDate || null,
            endDate: u.endDate || null,
            learningActivities: u.learningActivities.filter((a: any) => a.description),
            teachingActivities: u.teachingActivities.filter((a: any) => a.description),
            indicadores: u.indicadores,
            nivelesDesempeno: u.nivelesDesempeno,
        })),
        evaluation_items: evaluationItems.value.map((e: any) => ({
            evidence: e.evidence,
            weight: Number(e.weight) || 0,
            unitNumber: e.unitNumber,
            instrumentLabel: e.instrumentLabel || null,
            indicators: e.indicators,
        })),
    }
}

/**
 * Persiste de inmediato: crea el registro si aún no existe (autoguardado al entrar)
 * o actualiza. Encola un re-guardado si llegaron cambios mientras guardaba.
 */
async function persistNow(): Promise<void> {
    if (savingNow) { pendingChanges = true; return }
    if (!header.studyProgramId) return // sin programa no hay nada que persistir
    savingNow = true
    saveState.value = 'saving'
    try {
        const payload = buildPayload()
        if (instId.value) {
            await api.put(API.TEACHING_API.instrumentations.update(instId.value), payload)
        } else {
            const { data } = await api.post(API.TEACHING_API.instrumentations.create, payload)
            instId.value = data?.id ?? instId.value
            if (data?.status) status.value = data.status
            // Mantener la URL en sincronía (refresh-safe) sin recargar.
            if (instId.value) {
                router.replace({ name: 'teaching.planeacion.edit', params: { id: instId.value }, query: route.query }).catch(() => {})
            }
        }
        saveState.value = 'saved'
    } catch {
        saveState.value = 'error'
    } finally {
        savingNow = false
        if (pendingChanges) { pendingChanges = false; void persistNow() }
    }
}

/** Autoguardado con debounce ante cualquier cambio del formulario. */
function scheduleSave(): void {
    if (!ready.value) return
    saveState.value = 'saving'
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { void persistNow() }, 900)
}

async function goBack(): Promise<void> {
    if (saveTimer) { clearTimeout(saveTimer); await persistNow() }
    router.push({ name: 'teaching.planeacion' })
}

/* Pequeños componentes de presentación inline (sin archivo aparte). */
const ReadField = (props: { label: string; value: any }) =>
    h('div', [
        h('label', { class: 'block text-[11px] uppercase tracking-wider text-slate-500 mb-1' }, props.label),
        h('div', { class: 'px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded text-slate-700' }, props.value ?? '—'),
    ])
const Field = (props: any, { slots }: any) =>
    h('div', [
        h('label', { class: 'block text-[11px] uppercase tracking-wider text-slate-500 mb-1' }, props.label),
        slots.default?.(),
    ])
const ActivityList = (props: { title: string; items: any[] }) =>
    h('div', { class: 'space-y-1' }, [
        h('div', { class: 'flex items-center justify-between' }, [
            h('span', { class: 'text-xs font-medium text-slate-500' }, props.title),
            h('button', { type: 'button', class: 'text-xs text-blue-600', onClick: () => props.items.push({ description: '' }) }, '+ Actividad'),
        ]),
        ...props.items.map((a: any, j: number) =>
            h('div', { class: 'flex gap-2 items-center', key: j }, [
                h('input', {
                    value: a.description,
                    onInput: (e: any) => { a.description = e.target.value },
                    class: 'flex-1 px-2 py-1 text-xs border border-slate-300 rounded',
                }),
                h('button', { type: 'button', class: 'text-red-400 hover:text-red-600 text-xs', onClick: () => props.items.splice(j, 1) }, '✕'),
            ])
        ),
    ])
</script>
