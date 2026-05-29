<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                {{ isEdit ? 'Editar programa de estudio' : 'Nuevo programa de estudio' }}
            </h1>
            <div class="flex items-center gap-2">
                <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                    @click="helpOpen = !helpOpen"
                >
                    <QuestionMarkCircleIcon class="w-4 h-4" /> Ayuda
                </button>
                <button type="button" class="text-sm text-slate-500 hover:text-slate-700" @click="router.back()">Volver</button>
                <button
                    type="button"
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="submitting || loading"
                    @click="submit"
                >{{ submitting ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear programa') }}</button>
            </div>
        </div>

        <div v-if="loading" class="text-sm text-slate-500">Cargando…</div>

        <div v-else class="flex gap-4">
            <div class="flex-1 min-w-0">
                <Tabs v-model="activeTab" :tabs="tabs">
                    <!-- DATOS GENERALES -->
                    <template v-if="activeTab === 'general'">
                        <div class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInput label="CLAVE" v-model="form.clave" uppercase required :error="errors.clave" />
                                <FormInput label="PLAN DE ESTUDIOS (ID)" type="number" v-model="form.study_plan_id" required :error="errors.study_plan_id" />
                                <FormInput label="ASIGNATURA (ID, opcional)" type="number" v-model="form.subject_id" :error="errors.subject_id" />
                            </div>
                            <FormInput label="NOMBRE" v-model="form.name" required :error="errors.name" />
                            <div class="grid grid-cols-3 gap-4">
                                <FormInput label="SATCA T (horas teoría)" type="number" v-model="form.satca_t" />
                                <FormInput label="SATCA P (horas práctica)" type="number" v-model="form.satca_p" />
                                <FormInput label="SATCA C (créditos)" type="number" v-model="form.satca_c" />
                            </div>
                        </div>
                    </template>

                    <!-- CARACTERIZACIÓN E INTENCIÓN -->
                    <template v-else-if="activeTab === 'narrativa'">
                        <div class="space-y-4">
                            <FormTextarea label="1. Caracterización de la asignatura" v-model="form.caracterizacion" :rows="8" />
                            <FormTextarea label="2. Intención didáctica" v-model="form.intencion_didactica" :rows="8" />
                        </div>
                    </template>

                    <!-- COMPETENCIAS -->
                    <template v-else-if="activeTab === 'competencias'">
                        <div class="space-y-4">
                            <FormTextarea label="3.1 Competencias previas" v-model="form.competencias_previas" :rows="4" />
                            <FormTextarea label="3.3 Competencia específica de la asignatura (objetivo)" v-model="form.competencia_especifica" :rows="4" />
                        </div>
                    </template>

                    <!-- UNIDADES (temario) -->
                    <template v-else-if="activeTab === 'unidades'">
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <h2 class="text-sm font-semibold text-slate-700">Unidades / competencias</h2>
                                <button type="button" class="text-sm text-blue-600 hover:text-blue-800" @click="addUnidad">+ Unidad</button>
                            </div>
                            <div v-for="(unidad, i) in form.temas" :key="i" class="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
                                <div class="grid grid-cols-12 gap-3 items-start">
                                    <div class="col-span-2"><FormInput label="Unidad N°" type="number" v-model="unidad.number" /></div>
                                    <div class="col-span-9"><FormInput label="Nombre de la unidad / competencia" v-model="unidad.title" /></div>
                                    <div class="col-span-1 pt-6 text-right">
                                        <button type="button" class="text-red-500 hover:text-red-700 text-sm" @click="form.temas.splice(i, 1)">✕</button>
                                    </div>
                                </div>
                                <FormTextarea label="Descripción de la competencia específica de la unidad" v-model="unidad.competenciaEspecifica" :rows="2" />

                                <!-- Temas y subtemas -->
                                <div class="border-l-2 border-blue-200 pl-3 space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="text-xs font-medium text-slate-500">Temas y subtemas</span>
                                        <button type="button" class="text-xs text-blue-600" @click="addSubtema(unidad)">+ Subtema</button>
                                    </div>
                                    <div v-for="(sub, j) in unidad.subtemas" :key="j" class="flex gap-2 items-center">
                                        <input v-model="sub.number" class="w-20 px-2 py-1 text-xs border border-slate-300 rounded" placeholder="1.1" />
                                        <input v-model="sub.title" class="flex-1 px-2 py-1 text-xs border border-slate-300 rounded" placeholder="Título del subtema" />
                                        <button type="button" class="text-red-400 hover:text-red-600 text-xs" @click="unidad.subtemas.splice(j, 1)">✕</button>
                                    </div>
                                    <p v-if="!unidad.subtemas.length" class="text-[11px] text-slate-400">Sin subtemas.</p>
                                </div>

                                <!-- Actividades de aprendizaje -->
                                <div class="border-l-2 border-emerald-200 pl-3 space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="text-xs font-medium text-slate-500">Actividades de aprendizaje</span>
                                        <button type="button" class="text-xs text-blue-600" @click="unidad.learningActivities.push({ description: '' })">+ Actividad</button>
                                    </div>
                                    <div v-for="(act, k) in unidad.learningActivities" :key="k" class="flex gap-2 items-center">
                                        <input v-model="act.description" class="flex-1 px-2 py-1 text-xs border border-slate-300 rounded" placeholder="Describe la actividad de aprendizaje" />
                                        <button type="button" class="text-red-400 hover:text-red-600 text-xs" @click="unidad.learningActivities.splice(k, 1)">✕</button>
                                    </div>
                                </div>
                            </div>
                            <p v-if="!form.temas.length" class="text-xs text-slate-400">Sin unidades. Agrega al menos una.</p>
                        </div>
                    </template>

                    <!-- FUENTES -->
                    <template v-else-if="activeTab === 'fuentes'">
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <h2 class="text-sm font-semibold text-slate-700">Fuentes de información</h2>
                                <button type="button" class="text-sm text-blue-600 hover:text-blue-800" @click="form.sources.push({ reference: '', type: '' })">+ Fuente</button>
                            </div>
                            <div v-for="(src, i) in form.sources" :key="i" class="flex gap-2 items-center">
                                <input v-model="src.reference" class="flex-1 px-2 py-1 text-sm border border-slate-300 rounded" placeholder="Referencia bibliográfica" />
                                <button type="button" class="text-red-400 hover:text-red-600 text-xs" @click="form.sources.splice(i, 1)">✕</button>
                            </div>
                        </div>
                    </template>
                </Tabs>
            </div>

            <!-- Panel lateral de ayuda -->
            <aside v-if="helpOpen" class="w-80 shrink-0">
                <div class="sticky top-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold text-amber-800">¿De dónde lo saco?</h3>
                        <button type="button" class="text-amber-700 hover:text-amber-900 text-xs" @click="helpOpen = false">Cerrar ✕</button>
                    </div>
                    <p class="text-[11px] text-amber-700 mb-3">Referencia: programa oficial TecNM (plantilla "mayo 2016").</p>
                    <div class="space-y-1.5 text-[13px] text-amber-900 leading-relaxed">
                        <p class="font-semibold">{{ help[activeTab].title }}</p>
                        <ul class="list-disc list-inside space-y-1">
                            <li v-for="(line, idx) in help[activeTab].items" :key="idx">{{ line }}</li>
                        </ul>
                    </div>
                </div>
            </aside>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormTextarea from '@/app/components/ui/form/FormTextarea.vue'
import Tabs from '@/app/components/ui/Tabs.vue'
import { useFormErrors } from '@/app/components/ui/form/useFormErrors'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const route = useRoute()
const router = useRouter()
const { errors, setErrors, clearErrors } = useFormErrors()

const programId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => programId.value !== null)

const loading = ref(false)
const submitting = ref(false)
const activeTab = ref('general')
const helpOpen = ref(false)

const tabs = [
    { key: 'general', label: 'Datos generales' },
    { key: 'narrativa', label: 'Caracterización e intención' },
    { key: 'competencias', label: 'Competencias' },
    { key: 'unidades', label: 'Unidades' },
    { key: 'fuentes', label: 'Fuentes' },
]

const help: Record<string, { title: string; items: string[] }> = {
    general: {
        title: 'Portada del programa (pág. 1)',
        items: [
            'Nombre de la asignatura, Clave (ej. SCD-1011) y Carrera/Plan, en el recuadro de datos generales.',
            'SATCA = "Horas teoría - Horas práctica - Créditos" (ej. 2-3-5).',
        ],
    },
    narrativa: {
        title: 'Secciones 1 y 2',
        items: [
            'Caracterización: sección "1. Caracterización de la asignatura" (pág. 1).',
            'Intención didáctica: sección "2. Intención didáctica" (pág. 2).',
        ],
    },
    competencias: {
        title: 'Sección 3 — Competencias',
        items: [
            'Competencias previas: subsección "3.1 Competencias previas".',
            'Competencia específica: subsección "3.3 Competencia específica de la asignatura".',
            'Las competencias genéricas (3.2) se capturan en la instrumentación, no aquí.',
        ],
    },
    unidades: {
        title: 'Temas y subtemas por competencia',
        items: [
            'Cada Unidad = una competencia numerada (1, 2, 3…) con su nombre y descripción ("Competencia No. / Descripción").',
            'Dentro de cada unidad van los subtemas con su numeración (1.1, 1.2, 1.2.1…) tomados de "Temas y subtemas para desarrollar la competencia específica".',
            'Las actividades de aprendizaje son las de la columna "Actividades de aprendizaje" de esa competencia.',
        ],
    },
    fuentes: {
        title: 'Sección 5',
        items: [
            'Lista bibliográfica de "5. Fuentes de información y apoyos didácticos".',
            'Captura una referencia por renglón.',
        ],
    },
}

const form = reactive<any>({
    clave: '', study_plan_id: '', subject_id: '', name: '',
    satca_t: '', satca_p: '', satca_c: '',
    caracterizacion: '', intencion_didactica: '', competencia_especifica: '', competencias_previas: '',
    temas: [] as any[],
    sources: [] as any[],
})

function addUnidad() {
    form.temas.push({ number: form.temas.length + 1, title: '', competenciaEspecifica: '', subtemas: [], learningActivities: [] })
}
function addSubtema(unidad: any) {
    const n = unidad.number || form.temas.indexOf(unidad) + 1
    unidad.subtemas.push({ number: `${n}.${unidad.subtemas.length + 1}`, title: '' })
}

onMounted(async () => {
    if (!isEdit.value) return
    loading.value = true
    try {
        const { data } = await api.get(API.STUDY_PROGRAMS_API.studyPrograms.byId(programId.value!))
        form.clave = data.claveNormalized ?? ''
        form.study_plan_id = data.studyPlanId ?? ''
        form.subject_id = data.subjectId ?? ''
        form.name = data.name ?? ''
        form.satca_t = data.satcaT ?? ''
        form.satca_p = data.satcaP ?? ''
        form.satca_c = data.satcaC ?? ''
        form.caracterizacion = data.caracterizacion ?? ''
        form.intencion_didactica = data.intencionDidactica ?? ''
        form.competencia_especifica = data.competenciaEspecifica ?? ''
        form.competencias_previas = data.competenciasPrevias ?? ''
        form.temas = (data.temas ?? []).map((t: any) => ({
            number: t.number, title: t.title,
            competenciaEspecifica: t.competenciaEspecifica ?? '',
            subtemas: (t.subtemas ?? []).map((s: any) => ({ number: s.number ?? '', title: s.title ?? '' })),
            learningActivities: (t.learningActivities ?? []).map((a: any) => ({ description: a.description ?? '' })),
        }))
        form.sources = (data.sources ?? []).map((s: any) => ({ reference: s.reference, type: s.type ?? '' }))
    } finally {
        loading.value = false
    }
})

async function submit() {
    submitting.value = true
    clearErrors()
    const payload = {
        clave: form.clave,
        study_plan_id: form.study_plan_id ? Number(form.study_plan_id) : null,
        subject_id: form.subject_id ? Number(form.subject_id) : null,
        name: form.name,
        satca_t: form.satca_t !== '' ? Number(form.satca_t) : null,
        satca_p: form.satca_p !== '' ? Number(form.satca_p) : null,
        satca_c: form.satca_c !== '' ? Number(form.satca_c) : null,
        caracterizacion: form.caracterizacion || null,
        intencion_didactica: form.intencion_didactica || null,
        competencia_especifica: form.competencia_especifica || null,
        competencias_previas: form.competencias_previas || null,
        temas: form.temas.map((t: any, i: number) => ({
            number: t.number ? Number(t.number) : i + 1,
            title: t.title,
            competenciaEspecifica: t.competenciaEspecifica || null,
            subtemas: (t.subtemas ?? []).filter((s: any) => s.number || s.title),
            learningActivities: (t.learningActivities ?? []).filter((a: any) => a.description),
        })),
        sources: form.sources.map((s: any) => ({ reference: s.reference, type: s.type || null })),
    }

    try {
        if (isEdit.value) {
            await api.put(API.STUDY_PROGRAMS_API.studyPrograms.update(programId.value!), payload)
        } else {
            await api.post(API.STUDY_PROGRAMS_API.studyPrograms.create, payload)
        }
        router.push({ name: 'study-programs.index' })
    } catch (e: any) {
        if (e?.response?.status === 422) {
            setErrors(e.response.data.errors ?? {})
        }
    } finally {
        submitting.value = false
    }
}
</script>
