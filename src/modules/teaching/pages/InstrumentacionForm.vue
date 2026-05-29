<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-xl font-semibold text-slate-800">
                    {{ isEdit ? 'Editar instrumentación' : 'Nueva instrumentación' }}
                </h1>
                <p v-if="header.studyProgram" class="text-xs text-slate-500 mt-0.5">
                    {{ header.studyProgram.claveNormalized }} · {{ header.studyProgram.name }}
                </p>
            </div>
            <div class="flex items-center gap-2">
                <button type="button" class="text-sm text-slate-500 hover:text-slate-700" @click="router.back()">Volver</button>
                <button
                    type="button"
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="submitting || loading"
                    @click="submit"
                >{{ submitting ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear instrumentación') }}</button>
            </div>
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
                        <FormInput label="TÍTULO (opcional)" v-model="header.title" />
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
                    <Field label="3.2 Competencias genéricas"><textarea v-model="header.competencias_genericas" rows="6" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea></Field>
                    <Field label="3.3 Competencias específicas de la asignatura"><textarea v-model="header.competencia_especifica_override" rows="4" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea></Field>
                </div>
            </template>

            <!-- UNIDAD N -->
            <template v-else-if="activeUnit !== null">
                <div class="space-y-5">
                    <!-- FRENTE -->
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

                    <!-- ATRÁS -->
                    <section class="space-y-3 border-t border-slate-200 pt-4">
                        <h3 class="text-sm font-semibold text-slate-700">Unidad {{ activeUnit.number }} — Atrás (evaluación)</h3>

                        <Field label="Indicadores de alcance">
                            <table class="w-full text-xs border border-slate-200">
                                <thead class="bg-slate-50"><tr><th class="border px-2 py-1 w-8"></th><th class="border px-2 py-1 text-left">Indicador</th><th class="border px-2 py-1 w-20">Valor</th></tr></thead>
                                <tbody>
                                    <tr v-for="ind in activeUnit.indicadores" :key="ind.letter">
                                        <td class="border px-2 py-1 text-center font-semibold uppercase">{{ ind.letter }}</td>
                                        <td class="border px-1 py-1"><input v-model="ind.description" class="w-full px-1 py-0.5 border border-slate-200 rounded text-xs" /></td>
                                        <td class="border px-1 py-1"><input v-model.number="ind.value" type="number" class="w-full px-1 py-0.5 border border-slate-200 rounded text-xs text-center" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </Field>

                        <Field label="Matriz de evaluación">
                            <table class="w-full text-xs border border-slate-200">
                                <thead class="bg-slate-50">
                                    <tr>
                                        <th class="border px-2 py-1 text-left">Evidencia de aprendizaje</th>
                                        <th class="border px-2 py-1 w-14">%</th>
                                        <th v-for="ind in activeUnit.indicadores" :key="ind.letter" class="border px-1 py-1 w-7 uppercase">{{ ind.letter }}</th>
                                        <th class="border px-2 py-1 text-left">Instrumento</th>
                                        <th class="border px-1 py-1 w-7"></th>
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
                            </table>
                            <div class="flex items-center justify-between mt-1">
                                <button type="button" class="text-xs text-blue-600" @click="addEvidence(activeUnit.number)">+ Evidencia</button>
                                <span class="text-xs" :class="unitWeight(activeUnit.number) === 100 ? 'text-emerald-600' : 'text-slate-500'">Total unidad: {{ unitWeight(activeUnit.number) }}%</span>
                            </div>
                        </Field>
                    </section>
                </div>
            </template>

            <!-- CALENDARIO -->
            <template v-else-if="activeTab === 'calendario'">
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-semibold text-slate-700">Calendarización de evaluación</h3>
                        <button type="button" class="text-xs text-blue-600" @click="addWeek">+ Semana</button>
                    </div>
                    <table class="w-full text-xs border border-slate-200">
                        <thead class="bg-slate-50"><tr><th class="border px-2 py-1 w-16">Semana</th><th class="border px-2 py-1 w-16">Unidad</th><th class="border px-2 py-1">Del</th><th class="border px-2 py-1">Al</th><th class="border px-2 py-1 w-16">T.P.</th><th class="border px-2 py-1 w-16">T.R.</th><th class="border px-2 py-1 w-16">S.D.</th><th class="border px-1 py-1 w-7"></th></tr></thead>
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
                    </table>
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
import { reactive, ref, computed, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import Tabs from '@/app/components/ui/Tabs.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const route = useRoute()
const router = useRouter()

const instId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => instId.value !== null)

const loading = ref(true)
const submitting = ref(false)
const activeTab = ref('portada')

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

const satcaText = computed(() => `${header.satca?.t ?? '?'}-${header.satca?.p ?? '?'}-${header.satca?.c ?? '?'}`)

const tabs = computed(() => [
    { key: 'portada', label: 'Portada' },
    { key: 'intencion', label: 'Intención' },
    { key: 'competencias', label: 'Competencias' },
    ...units.value.map((_, i) => ({ key: `unit-${i}`, label: `Unidad ${units.value[i].number}` })),
    { key: 'calendario', label: 'Calendario' },
    { key: 'fuentes', label: 'Fuentes' },
])

const activeUnitIndex = computed(() => (activeTab.value.startsWith('unit-') ? Number(activeTab.value.slice(5)) : -1))
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
    activeTab.value = `unit-${units.value.length - 1}`
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
    header.title = data.title ?? ''
    header.caracterizacion = data.caracterizacion ?? ''
    header.intencion_didactica = data.intencionDidactica ?? ''
    header.competencias_previas = data.competenciasPrevias ?? ''
    header.competencias_genericas = data.competenciasGenericas ?? ''
    header.competencia_especifica_override = data.competenciaEspecificaOverride ?? ''
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

onMounted(async () => {
    loading.value = true
    try {
        if (isEdit.value) {
            const { data } = await api.get(API.TEACHING_API.instrumentations.byId(instId.value!))
            header.teacher_assignment_id = data.teacherAssignmentId ?? header.teacher_assignment_id
            hydrate(data)
        } else {
            const { data } = await api.get(API.TEACHING_API.instrumentations.seed(header.teacher_assignment_id))
            hydrate(data)
        }
    } finally {
        loading.value = false
    }
})

async function submit() {
    submitting.value = true
    const payload: any = {
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
    try {
        if (isEdit.value) {
            await api.put(API.TEACHING_API.instrumentations.update(instId.value!), payload)
        } else {
            await api.post(API.TEACHING_API.instrumentations.create, payload)
        }
        router.push({ name: 'teaching.planeacion' })
    } finally {
        submitting.value = false
    }
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
