<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { createSgiFormsClient, type SgiFormsAttemptClient } from '@/modules/evd/api/sgiFormsClient'
import QuestionField from '@/modules/evd/components/QuestionField.vue'
import type { EvaluationStartResponse } from '@/modules/evd/types/evd.type'

interface AttemptPayload {
    attempt: {
        id: number
        form_id: number
        subject_id: string
        context: Record<string, unknown> | null
        status: string
        started_at: string | null
        finished_at: string | null
        computed_score: number | null
        max_score: number | null
    }
    form: {
        id: number
        slug: string
        title: string
        description: string | null
        type: string
        auto_score: boolean
        config: Record<string, any> | null
    }
    sections: Array<{
        id: number
        title: string
        description: string | null
        position: number
        questions: Array<{
            id: number
            type: string
            statement: string
            position: number
            required: boolean
            options: Array<{ id: number; label: string; position: number; value: number | null }>
        }>
    }>
    answers: Array<{
        question_id: number
        option_id: number | null
        selected_option_ids: number[] | null
        text: string | null
        scalar: number | null
    }>
}

interface Selection { option_id?: number; selected_option_ids?: number[]; text?: string; scalar?: number }

const route  = useRoute()
const router = useRouter()

const assignmentId = computed(() => Number(route.params.assignmentId))

let client: SgiFormsAttemptClient | null = null
const attemptId  = ref<number | null>(null)
const data       = ref<AttemptPayload | null>(null)
const loading    = ref(true)
const error      = ref<string | null>(null)
const saving     = ref(false)
const finishing  = ref(false)
const finished   = ref<{ computed_score: number | null; max_score: number | null } | null>(null)

// answers en memoria, indexadas por question_id
const answers = reactive<Record<number, Selection>>({})
const sectionOpen = reactive<Record<number, boolean>>({})

// Modo de visualización configurable por cuestionario (form.config.layout).
const layout = computed<'wizard' | 'accordion'>(() => {
    const l = data.value?.form.config?.layout
    return l === 'wizard' ? 'wizard' : 'accordion'
})

function toggleSection(sid: number) {
    sectionOpen[sid] = !sectionOpen[sid]
}

// asistente paso a paso: una categoría (sección) por pantalla
const currentStep = ref(0)
const sections = computed(() => data.value?.sections ?? [])
const currentSection = computed(() => sections.value[currentStep.value] ?? null)
const isFirstStep = computed(() => currentStep.value <= 0)
const isLastStep = computed(() => currentStep.value >= sections.value.length - 1)

function sectionAnswered(s: AttemptPayload['sections'][number]): number {
    let n = 0
    for (const q of s.questions) if (isAnswered(q.id)) n++
    return n
}
function sectionComplete(s: AttemptPayload['sections'][number]): boolean {
    return s.questions.every(q => !q.required || isAnswered(q.id))
}
function sectionRequiredMissing(s: AttemptPayload['sections'][number]): boolean {
    return s.questions.some(q => q.required && !isAnswered(q.id))
}

function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
}
function goToStep(i: number) {
    if (i < 0 || i >= sections.value.length) return
    currentStep.value = i
    scrollTop()
}
function nextStep() { if (!isLastStep.value) goToStep(currentStep.value + 1) }
function prevStep() { if (!isFirstStep.value) goToStep(currentStep.value - 1) }

const totalQuestions = computed(() => (data.value?.sections ?? []).reduce((acc, s) => acc + s.questions.length, 0))
const answeredCount = computed(() => {
    let n = 0
    for (const s of data.value?.sections ?? []) {
        for (const q of s.questions) {
            if (isAnswered(q.id)) n++
        }
    }
    return n
})
const progressPct = computed(() => totalQuestions.value ? Math.round(answeredCount.value / totalQuestions.value * 100) : 0)
const requiredMissing = computed(() => {
    for (const s of data.value?.sections ?? []) {
        for (const q of s.questions) {
            if (q.required && !isAnswered(q.id)) return true
        }
    }
    return false
})

function isAnswered(qid: number): boolean {
    const a = answers[qid]
    if (!a) return false
    if (a.option_id !== undefined) return true
    if (Array.isArray(a.selected_option_ids) && a.selected_option_ids.length) return true
    if (typeof a.text === 'string' && a.text.trim()) return true
    if (typeof a.scalar === 'number') return true
    return false
}

async function load() {
    if (!assignmentId.value || isNaN(assignmentId.value)) {
        error.value = 'Asignación inválida.'
        loading.value = false
        return
    }
    loading.value = true
    error.value = null
    try {
        // 1. Pedir a sgiv3 el token EVD + datos de integración (idempotente).
        const { data: start } = await api.post<EvaluationStartResponse>(API.EVD_API.start(assignmentId.value))
        if (!start.sgi_forms_url || !start.sso_token) {
            error.value = 'La integración con sgi_forms no está configurada en este plantel.'
            return
        }

        // 2. Cliente directo a sgi_forms con el sso_token como Bearer.
        client = createSgiFormsClient(start.sgi_forms_url, start.sso_token)

        // 3. Abrir/recuperar el attempt para este alumno + assignment.
        const sc = await client.startWithContext(start.form_slug)
        attemptId.value = sc.attempt_id

        // 4. Cargar el cuestionario + respuestas guardadas.
        const res: AttemptPayload = await client.show(sc.attempt_id)
        data.value = res

        for (const a of res.answers) {
            const selObj: Selection = {}
            if (a.option_id !== null)                  selObj.option_id = a.option_id
            if (Array.isArray(a.selected_option_ids))  selObj.selected_option_ids = a.selected_option_ids
            if (a.text !== null && a.text !== '')      selObj.text = a.text
            if (a.scalar !== null)                     selObj.scalar = Number(a.scalar)
            answers[a.question_id] = selObj
        }
        ;(res.sections ?? []).forEach((s, i) => { sectionOpen[s.id] = i === 0 })
        currentStep.value = 0

        if (res.attempt.status === 'completed') {
            finished.value = { computed_score: res.attempt.computed_score, max_score: res.attempt.max_score }
        }
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? e?.message ?? 'No se pudo cargar el cuestionario.'
    } finally {
        loading.value = false
    }
}

// Auto-save con debounce
let saveTimer: number | undefined
function queueSave() {
    if (finished.value) return
    window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(saveNow, 600)
}

async function saveNow() {
    if (!data.value || !client || attemptId.value === null || finished.value || saving.value) return
    saving.value = true
    try {
        const payload = Object.entries(answers)
            .filter(([qid]) => isAnswered(Number(qid)))
            .map(([qid, sel]) => ({
                question_id: Number(qid),
                option_id:   sel.option_id ?? null,
                selected_option_ids: sel.selected_option_ids ?? null,
                text:    sel.text ?? null,
                scalar:  sel.scalar ?? null,
            }))
        if (payload.length === 0) return
        await client.saveAnswers(attemptId.value, payload)
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo guardar (reintentaré al cambiar otra respuesta).'
    } finally {
        saving.value = false
    }
}

async function finish() {
    if (finishing.value || !data.value || !client || attemptId.value === null) return
    if (requiredMissing.value) {
        error.value = 'Faltan preguntas obligatorias por responder.'
        return
    }
    finishing.value = true
    error.value = null
    try {
        window.clearTimeout(saveTimer)
        await saveNow()
        const res = await client.finish(attemptId.value)
        finished.value = { computed_score: res.computed_score ?? null, max_score: res.max_score ?? null }
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo entregar la evaluación.'
    } finally {
        finishing.value = false
    }
}

function backToList() {
    router.push({ name: 'evd.my-evaluations' })
}

watch(() => answers, queueSave, { deep: true })

onMounted(load)
</script>

<template>
    <div class="space-y-4 w-full max-w-6xl mx-auto">
        <!-- Volver -->
        <button type="button" class="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1" @click="backToList">
            ◀ Volver a Mis Evaluaciones
        </button>

        <div v-if="loading" class="text-center text-sm text-slate-400 py-12">Cargando cuestionario…</div>
        <div v-else-if="error && !data" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>

        <template v-if="data">
            <!-- Header -->
            <div class="bg-white border border-slate-200 rounded-xl p-4">
                <h2 class="text-lg font-semibold text-slate-800 uppercase">{{ data.form.title }}</h2>
                <p v-if="data.form.description" class="text-xs text-slate-500 mt-1">{{ data.form.description }}</p>
            </div>

            <!-- Banderas -->
            <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>

            <!-- Estado final si ya cerró -->
            <div v-if="finished" class="bg-emerald-50 border border-emerald-300 rounded-xl p-6 text-center">
                <div class="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <h3 class="text-base font-bold text-emerald-800 uppercase">Evaluación entregada</h3>
                <p v-if="data.form.config?.show_score && data.form.auto_score && finished.computed_score !== null && finished.max_score !== null"
                   class="text-sm text-emerald-700 mt-2">
                    Tu puntaje: <strong>{{ finished.computed_score }}</strong> / {{ finished.max_score }}
                </p>
                <button type="button"
                    class="mt-4 px-4 py-2 rounded-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                    @click="backToList">
                    Volver a Mis Evaluaciones
                </button>
            </div>

            <!-- =========================== LAYOUT: WIZARD =========================== -->
            <template v-if="!finished && layout === 'wizard'">
                <!-- Stepper + progreso -->
                <div class="bg-white border border-slate-200 rounded p-3 sticky top-0 z-10 space-y-3">
                    <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
                        <button
                            v-for="(s, i) in data.sections"
                            :key="s.id"
                            type="button"
                            class="shrink-0 w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center border transition-colors"
                            :class="i === currentStep
                                ? 'bg-blue-600 text-white border-blue-600'
                                : sectionComplete(s)
                                    ? 'bg-emerald-500 text-white border-emerald-500'
                                    : 'bg-white text-slate-500 border-slate-300'"
                            :title="s.title"
                            @click="goToStep(i)"
                        >
                            {{ sectionComplete(s) && i !== currentStep ? '✓' : s.position }}
                        </button>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex-1">
                            <div class="text-xs text-slate-500 mb-1 flex items-center gap-2">
                                <span>{{ answeredCount }} / {{ totalQuestions }} respondidas · {{ progressPct }}%</span>
                                <span v-if="saving" class="text-[10px] text-slate-400 italic">guardando…</span>
                                <span v-else-if="answeredCount > 0" class="text-[10px] text-emerald-600">✓ guardado</span>
                            </div>
                            <div class="h-2 bg-slate-100 rounded overflow-hidden">
                                <div class="h-full bg-emerald-500 transition-all" :style="{ width: progressPct + '%' }"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Categoría actual -->
                <section v-if="currentSection" class="bg-white border border-slate-200 rounded">
                    <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-mono text-slate-500">Paso {{ currentStep + 1 }} de {{ data.sections.length }}</span>
                            <span class="font-semibold text-slate-800 text-left">{{ currentSection.title }}</span>
                        </div>
                        <span class="text-xs font-medium"
                              :class="sectionRequiredMissing(currentSection) ? 'text-slate-400' : 'text-emerald-600'">
                            {{ sectionAnswered(currentSection) }}/{{ currentSection.questions.length }}
                            <span v-if="!sectionRequiredMissing(currentSection)">✓</span>
                        </span>
                    </div>
                    <div class="p-4 space-y-5">
                        <p v-if="currentSection.description" class="text-xs text-slate-500">{{ currentSection.description }}</p>
                        <QuestionField
                            v-for="q in currentSection.questions"
                            :key="q.id"
                            :question="q"
                            :selection="answers[q.id]"
                            :question-style="data.form.config?.question_style"
                            @update="sel => { answers[q.id] = sel; queueSave() }"
                        />
                    </div>
                </section>

                <!-- Navegación -->
                <div class="flex items-center justify-between gap-3 pb-8">
                    <button
                        type="button"
                        class="px-4 py-2 rounded-md text-sm font-semibold border border-slate-300 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                        :disabled="isFirstStep"
                        @click="prevStep"
                    >
                        ◀ Anterior
                    </button>

                    <button
                        v-if="!isLastStep"
                        type="button"
                        class="px-5 py-2 rounded-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700"
                        @click="nextStep"
                    >
                        Siguiente ▶
                    </button>
                    <button
                        v-else
                        type="button"
                        class="px-5 py-2 rounded-md text-sm font-bold text-white disabled:opacity-50"
                        :class="requiredMissing ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'"
                        :disabled="finishing || requiredMissing"
                        @click="finish"
                    >
                        {{ finishing ? 'Enviando…' : 'ENTREGAR' }}
                    </button>
                </div>
                <p v-if="isLastStep && requiredMissing" class="text-center text-xs text-rose-500 -mt-6">
                    Faltan preguntas obligatorias por responder en alguna categoría.
                </p>
            </template>

            <!-- =========================== LAYOUT: ACORDEÓN (default) =========================== -->
            <template v-else-if="!finished">
                <!-- Progreso + save indicator -->
                <div class="bg-white border border-slate-200 rounded p-3 flex items-center gap-3 sticky top-0 z-10">
                    <div class="flex-1">
                        <div class="text-xs text-slate-500 mb-1 flex items-center gap-2">
                            <span>{{ answeredCount }} / {{ totalQuestions }} respondidas · {{ progressPct }}%</span>
                            <span v-if="saving" class="text-[10px] text-slate-400 italic">guardando…</span>
                            <span v-else-if="answeredCount > 0" class="text-[10px] text-emerald-600">✓ guardado</span>
                        </div>
                        <div class="h-2 bg-slate-100 rounded overflow-hidden">
                            <div class="h-full bg-emerald-500 transition-all" :style="{ width: progressPct + '%' }"></div>
                        </div>
                    </div>
                    <button
                        class="px-4 py-2 rounded-md text-sm font-bold text-white disabled:opacity-50"
                        :class="requiredMissing ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'"
                        :disabled="finishing || requiredMissing"
                        @click="finish"
                    >
                        {{ finishing ? 'Enviando…' : 'ENTREGAR' }}
                    </button>
                </div>

                <!-- Secciones -->
                <section v-for="s in data.sections" :key="s.id" class="bg-white border border-slate-200 rounded">
                    <button
                        type="button"
                        class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 border-b border-slate-200"
                        @click="toggleSection(s.id)"
                    >
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-mono text-slate-500">#{{ s.position }}</span>
                            <span class="font-semibold text-slate-800 text-left">{{ s.title }}</span>
                        </div>
                        <span class="text-xs text-slate-500">{{ sectionOpen[s.id] ? '▾' : '▸' }}</span>
                    </button>
                    <div v-show="sectionOpen[s.id]" class="p-4 space-y-5">
                        <p v-if="s.description" class="text-xs text-slate-500">{{ s.description }}</p>
                        <QuestionField
                            v-for="q in s.questions"
                            :key="q.id"
                            :question="q"
                            :selection="answers[q.id]"
                            :question-style="data.form.config?.question_style"
                            @update="sel => { answers[q.id] = sel; queueSave() }"
                        />
                    </div>
                </section>
            </template>
        </template>
    </div>
</template>
