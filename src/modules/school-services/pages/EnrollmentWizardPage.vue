<template>
    <div class="space-y-4">
        <!-- Encabezado + stepper -->
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Inscripción asistida</h1>
            <p class="text-sm text-slate-500 mt-1">
                Selecciona aspirantes admitidos, configura su carrera/modalidad y confirma. La inscripción es <strong>todo-o-nada</strong>: si alguno falla, ninguno queda inscrito.
            </p>
        </div>

        <ol class="flex items-center gap-3 text-xs">
            <li v-for="(label, idx) in stepLabels" :key="idx"
                class="flex items-center gap-2"
                :aria-current="(idx + 1) === step ? 'step' : undefined"
                :class="idx + 1 === step ? 'font-bold text-blue-700' : (idx + 1 < step ? 'text-emerald-700' : 'text-slate-400')">
                <span
                    class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                    :class="idx + 1 === step ? 'bg-blue-600 text-white' : (idx + 1 < step ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500')"
                >
                    {{ idx + 1 < step ? '✓' : (idx + 1) }}
                </span>
                <span class="uppercase">{{ label }}</span>
                <ChevronRightIcon v-if="idx < stepLabels.length - 1" class="w-3 h-3 text-slate-300" />
            </li>
        </ol>

        <!-- ════════════════ PASO 1 — Seleccionar ════════════════ -->
        <section v-if="step === 1" class="space-y-4">
            <div class="flex flex-wrap gap-3 items-end">
                <div class="w-72">
                    <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">
                        Período Académico <span class="text-red-500">*</span>
                    </label>
                    <FormRemoteSelect
                        v-model="filterPeriodId"
                        :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                        :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                        :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                        item-label="name"
                        item-value="academicPeriodId"
                        placeholder="Selecciona un período..."
                        @update:model-value="onPeriodChange"
                    />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Buscar</label>
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Nombre, CURP, email..."
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        @input="debouncedSearch"
                    />
                </div>
            </div>

            <div v-if="!filterPeriodId" class="flex flex-col items-center justify-center py-12 text-slate-400 text-sm gap-2 border-2 border-dashed border-slate-200 rounded-xl">
                <CalendarDaysIcon class="w-10 h-10 opacity-40" />
                Selecciona un período para ver los aspirantes admitidos.
            </div>

            <div v-else-if="loading" class="text-center py-10 text-slate-400 text-sm">
                Cargando aspirantes...
            </div>

            <div v-else-if="items.length === 0" class="text-center py-10 text-slate-400 text-sm">
                No hay aspirantes admitidos en este período.
            </div>

            <div v-else class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                    <thead class="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr>
                            <th scope="col" class="px-4 py-3 text-left w-12">
                                <input
                                    type="checkbox"
                                    :checked="allSelected"
                                    @change="toggleAll"
                                    class="rounded border-slate-300"
                                />
                            </th>
                            <th scope="col" class="px-4 py-3 text-left">Aspirante</th>
                            <th scope="col" class="px-4 py-3 text-left">CURP</th>
                            <th scope="col" class="px-4 py-3 text-left">Puntaje</th>
                            <th scope="col" class="px-4 py-3 text-left">Opciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50">
                            <td class="px-4 py-3">
                                <input
                                    type="checkbox"
                                    :checked="selected.has(item.id)"
                                    @change="toggleSelect(item.id)"
                                    class="rounded border-slate-300"
                                />
                            </td>
                            <td class="px-4 py-3">
                                <p class="font-medium text-slate-800">{{ fullName(item) }}</p>
                                <p class="text-xs text-slate-400">{{ item.email }}</p>
                            </td>
                            <td class="px-4 py-3 font-mono text-xs text-slate-600 uppercase">
                                {{ item.curp || '—' }}
                            </td>
                            <td class="px-4 py-3">
                                <span class="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                    {{ item.entranceScore ?? '—' }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-xs text-slate-500">
                                <div v-for="n in [1, 2, 3]" :key="n" v-show="item[`offerOption${n}`]">
                                    <span class="font-semibold">Op. {{ n }}:</span>
                                    {{ item[`offerOption${n}`]?.career?.name || '—' }}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table></div>

                <div v-if="totalPages > 1" class="flex items-center justify-between text-xs text-slate-500 px-4 py-3 border-t bg-slate-50">
                    <span>Página {{ currentPage }} de {{ totalPages }} — {{ totalItems }} aspirantes</span>
                    <div class="flex gap-1">
                        <button class="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition" :disabled="currentPage === 1" @click="loadPage(currentPage - 1)">← Ant.</button>
                        <button class="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition" :disabled="currentPage === totalPages" @click="loadPage(currentPage + 1)">Sig. →</button>
                    </div>
                </div>
            </div>

            <div class="flex justify-end items-center gap-3 pt-2">
                <span v-if="selected.size > 0" class="text-xs text-slate-500">
                    {{ selected.size }} seleccionado(s)
                </span>
                <button
                    class="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition"
                    :disabled="selected.size === 0"
                    @click="goToStep2"
                >
                    Continuar →
                </button>
            </div>
        </section>

        <!-- ════════════════ PASO 2 — Configurar ════════════════ -->
        <section v-else-if="step === 2" class="space-y-4">
            <div class="bg-slate-50 border rounded-xl p-4 space-y-3">
                <div class="flex flex-wrap items-end gap-3">
                    <div class="w-72">
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">
                            Período de Ingreso <span class="text-red-500">*</span>
                        </label>
                        <FormRemoteSelect
                            v-model="entryPeriodId"
                            :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                            :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                            :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                            item-label="name"
                            item-value="academicPeriodId"
                            placeholder="Selecciona..."
                        />
                    </div>
                    <div class="flex-1 min-w-[280px]">
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Acciones rápidas</label>
                        <div class="flex gap-2">
                            <button class="px-3 py-1.5 text-xs rounded border border-slate-200 bg-white hover:bg-slate-100 transition"
                                v-for="n in [1, 2, 3]" :key="n" @click="bulkSetOption(n)">
                                Todos a opción {{ n }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                    <thead class="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr>
                            <th scope="col" class="px-4 py-3 text-left">Aspirante</th>
                            <th scope="col" class="px-4 py-3 text-left">Plan de estudio / Modalidad</th>
                            <th scope="col" class="px-4 py-3 text-right w-12">×</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="row in step2Rows" :key="row.applicant.id">
                            <td class="px-4 py-3">
                                <p class="font-medium text-slate-800">{{ fullName(row.applicant) }}</p>
                                <p class="text-xs text-slate-400 font-mono uppercase">{{ row.applicant.curp || '—' }}</p>
                            </td>
                            <td class="px-4 py-3">
                                <select
                                    v-model="row.offerKey"
                                    class="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:border-blue-400 outline-none"
                                >
                                    <option :value="null">— Seleccionar —</option>
                                    <option v-for="opt in row.options" :key="opt.key" :value="opt.key">
                                        {{ opt.label }}
                                    </option>
                                </select>
                            </td>
                            <td class="px-4 py-3 text-right">
                                <button aria-label="Quitar" class="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 transition" @click="removeFromSelection(row.applicant.id)" title="Quitar">
                                    <TrashIcon class="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table></div>
            </div>

            <div class="flex justify-between gap-3 pt-2">
                <button class="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition" @click="step = 1">
                    ← Volver
                </button>
                <button
                    class="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition"
                    :disabled="!canGoToStep3"
                    @click="goToStep3"
                >
                    Revisar preview →
                </button>
            </div>
        </section>

        <!-- ════════════════ PASO 3 — Preview / Confirmar ════════════════ -->
        <section v-else-if="step === 3" class="space-y-4">
            <div v-if="previewLoading" class="text-center py-10 text-slate-400 text-sm">
                Generando preview...
            </div>

            <template v-else>
                <div class="grid md:grid-cols-2 gap-3 text-sm">
                    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircleIcon class="w-8 h-8 text-emerald-600" />
                        <div>
                            <p class="text-2xl font-bold text-emerald-700">{{ previewOk.length }}</p>
                            <p class="text-xs text-emerald-700 uppercase font-semibold">Listos para inscribir</p>
                        </div>
                    </div>
                    <div class="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3" :class="{ 'opacity-50': previewFailed.length === 0 }">
                        <ExclamationTriangleIcon class="w-8 h-8 text-rose-600" />
                        <div>
                            <p class="text-2xl font-bold text-rose-700">{{ previewFailed.length }}</p>
                            <p class="text-xs text-rose-700 uppercase font-semibold">Con problemas</p>
                        </div>
                    </div>
                </div>

                <div v-if="previewOk.length > 0" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div class="px-4 py-3 border-b bg-emerald-50">
                        <p class="text-xs font-bold text-emerald-700 uppercase">Listos para inscribir</p>
                    </div>
                    <div class="overflow-x-auto w-full"><table class="w-full text-xs">
                        <thead class="text-slate-500">
                            <tr>
                                <th scope="col" class="px-4 py-2 text-left">Aspirante</th>
                                <th scope="col" class="px-4 py-2 text-left">Núm. Control (tentativo)</th>
                                <th scope="col" class="px-4 py-2 text-left">Carrera</th>
                                <th scope="col" class="px-4 py-2 text-left">Modalidad</th>
                                <th scope="col" class="px-4 py-2 text-left">Periodo de Ingreso</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-for="p in previewOk" :key="p.applicantId">
                                <td class="px-4 py-2 font-medium text-slate-700">{{ p.preview.fullName }}</td>
                                <td class="px-4 py-2 font-mono font-bold text-emerald-700">{{ p.preview.numControl }}</td>
                                <td class="px-4 py-2">{{ p.preview.careerName }}</td>
                                <td class="px-4 py-2">{{ p.preview.modalityName }}</td>
                                <td class="px-4 py-2">{{ p.preview.periodName }}</td>
                            </tr>
                        </tbody>
                    </table></div>
                </div>

                <div v-if="previewFailed.length > 0" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div class="px-4 py-3 border-b bg-rose-50">
                        <p class="text-xs font-bold text-rose-700 uppercase">No se pueden inscribir — corrige antes de continuar</p>
                    </div>
                    <div class="overflow-x-auto w-full"><table class="w-full text-xs">
                        <thead class="text-slate-500">
                            <tr>
                                <th scope="col" class="px-4 py-2 text-left">Aspirante</th>
                                <th scope="col" class="px-4 py-2 text-left">Razón</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-for="p in previewFailed" :key="p.applicantId">
                                <td class="px-4 py-2 font-medium text-slate-700">
                                    {{ p.preview.fullName || `Aspirante #${p.applicantId}` }}
                                </td>
                                <td class="px-4 py-2 text-rose-700">{{ p.reason }}</td>
                            </tr>
                        </tbody>
                    </table></div>
                </div>

                <div v-if="bulkError" class="bg-rose-50 border-2 border-rose-300 rounded-xl p-4">
                    <p class="text-sm font-bold text-rose-700">{{ bulkError }}</p>
                </div>

                <div class="flex justify-between items-center gap-3 pt-2">
                    <button class="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition" :disabled="confirming" @click="step = 2">
                        ← Volver a corregir
                    </button>
                    <div class="flex gap-2 items-center">
                        <span v-if="previewFailed.length > 0" class="text-xs text-rose-600">
                            Hay {{ previewFailed.length }} con problemas. Resuelve antes de confirmar.
                        </span>
                        <button
                            class="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition"
                            :disabled="previewFailed.length > 0 || previewOk.length === 0 || confirming"
                            @click="confirmEnroll"
                        >
                            {{ confirming ? 'Inscribiendo...' : `Confirmar inscripción (${previewOk.length})` }}
                        </button>
                    </div>
                </div>
            </template>
        </section>

        <!-- ════════════════ PASO 4 — Resultado ════════════════ -->
        <section v-else-if="step === 4" class="space-y-4">
            <div class="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-6 text-center">
                <CheckCircleIcon class="w-12 h-12 text-emerald-600 mx-auto" />
                <p class="text-xl font-bold text-emerald-700 mt-2">¡Inscripción completada!</p>
                <p class="text-sm text-emerald-700">{{ enrolledResult.length }} aspirante(s) ahora son estudiantes.</p>
            </div>

            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                    <thead class="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr>
                            <th scope="col" class="px-4 py-3 text-left">Aspirante</th>
                            <th scope="col" class="px-4 py-3 text-left">Núm. Control asignado</th>
                            <th scope="col" class="px-4 py-3 text-left">Student ID</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="r in enrolledResult" :key="r.applicantId">
                            <td class="px-4 py-3">{{ nameByApplicantId.get(r.applicantId) || `Aspirante #${r.applicantId}` }}</td>
                            <td class="px-4 py-3 font-mono font-bold text-emerald-700">{{ r.numControl }}</td>
                            <td class="px-4 py-3 text-xs text-slate-500">{{ r.studentId }}</td>
                        </tr>
                    </tbody>
                </table></div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
                <button class="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition" @click="resetWizard">
                    Inscribir más
                </button>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import {
    ChevronRightIcon, CalendarDaysIcon, TrashIcon,
    CheckCircleIcon, ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

// ── Tipos mínimos ───────────────────────────────────────────────────
interface OfferOption {
    id: number
    modalityId: number | null
    career?: { id: number; name: string } | null
    studyPlans?: Array<{ studyPlan?: { id: number; name: string } | null }>
}
interface AdmittedApplicant {
    id: number
    names: string
    firstSurname: string
    secondSurname: string | null
    email: string
    curp: string | null
    entranceScore: number | null
    offerOption1: OfferOption | null
    offerOption2: OfferOption | null
    offerOption3: OfferOption | null
    [k: string]: any
}

interface PreviewItem {
    applicantId: number
    ok: boolean
    reason: string | null
    preview: {
        numControl: string | null
        fullName: string | null
        careerName: string | null
        modalityName: string | null
        periodName: string | null
        currentPeriodNumber: number
    }
}

interface EnrolledResult {
    applicantId: number
    studentId: number
    numControl: string
}

// ── State ───────────────────────────────────────────────────────────
const step = ref(1)
const stepLabels = ['Seleccionar', 'Configurar', 'Preview', 'Resultado']

const filterPeriodId = ref<number | null>(null)
const entryPeriodId  = ref<number | null>(null)
const search   = ref('')
const items    = ref<AdmittedApplicant[]>([])
const selected = ref<Set<number>>(new Set())
const loading  = ref(false)
const totalItems  = ref(0)
const totalPages  = ref(0)
const currentPage = ref(1)
const perPage = 25

interface Step2Row {
    applicant: AdmittedApplicant
    options: Array<{ key: string; label: string; studyPlanId: number; modalityId: number }>
    offerKey: string | null
}
const step2Rows = reactive<Step2Row[]>([])

const previewLoading = ref(false)
const previewItems   = ref<PreviewItem[]>([])
const previewOk      = computed(() => previewItems.value.filter(p => p.ok))
const previewFailed  = computed(() => previewItems.value.filter(p => !p.ok))

const confirming      = ref(false)
const bulkError       = ref('')
const enrolledResult  = ref<EnrolledResult[]>([])
const nameByApplicantId = computed(() => {
    const m = new Map<number, string>()
    for (const r of step2Rows) m.set(r.applicant.id, fullName(r.applicant))
    return m
})

// ── Helpers ─────────────────────────────────────────────────────────
function fullName(a: AdmittedApplicant): string {
    return [a.firstSurname, a.secondSurname, a.names].filter(Boolean).join(' ').trim()
}

const allSelected = computed(() =>
    items.value.length > 0 && items.value.every(i => selected.value.has(i.id)),
)

let searchTimer: number | null = null
function debouncedSearch() {
    if (searchTimer) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => { loadPage(1) }, 300)
}

function onPeriodChange(val: number | null) {
    selected.value = new Set()
    if (val) loadPage(1)
    else { items.value = []; totalItems.value = 0 }
}

async function loadPage(page: number) {
    if (!filterPeriodId.value) return
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.admittedApplicants.list, {
            params: {
                page,
                per_page: perPage,
                'search[academic_period_id]': filterPeriodId.value,
                ...(search.value ? { 'search[term]': search.value } : {}),
            },
        })
        items.value      = data.items ?? data.data ?? []
        totalItems.value = data.meta?.total ?? data.total ?? items.value.length
        totalPages.value = Math.ceil(totalItems.value / perPage)
        currentPage.value = page
    } finally {
        loading.value = false
    }
}

function toggleSelect(id: number) {
    const next = new Set(selected.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selected.value = next
}

function toggleAll() {
    const next = new Set(selected.value)
    if (allSelected.value) items.value.forEach(i => next.delete(i.id))
    else                   items.value.forEach(i => next.add(i.id))
    selected.value = next
}

// ── Paso 1 → 2 ──────────────────────────────────────────────────────
function buildOfferOptions(a: AdmittedApplicant) {
    const opts: Step2Row['options'] = []
    for (const n of [1, 2, 3]) {
        const o = a[`offerOption${n}`] as OfferOption | null
        if (!o || !o.modalityId) continue
        for (const sp of o.studyPlans ?? []) {
            if (!sp.studyPlan) continue
            opts.push({
                key:          `${o.id}:${sp.studyPlan.id}`,
                label:        `Op. ${n} — ${o.career?.name ?? '—'} / ${sp.studyPlan.name}`,
                studyPlanId:  sp.studyPlan.id,
                modalityId:   o.modalityId!,
            })
        }
    }
    return opts
}

function goToStep2() {
    step2Rows.splice(0, step2Rows.length)
    const selectedItems = items.value.filter(i => selected.value.has(i.id))
    for (const a of selectedItems) {
        const opts = buildOfferOptions(a)
        step2Rows.push({
            applicant: a,
            options:   opts,
            offerKey:  opts[0]?.key ?? null,
        })
    }
    if (!entryPeriodId.value) entryPeriodId.value = filterPeriodId.value
    step.value = 2
}

function bulkSetOption(n: number) {
    for (const row of step2Rows) {
        const match = row.options.find(o => o.label.startsWith(`Op. ${n}`))
        if (match) row.offerKey = match.key
    }
}

function removeFromSelection(applicantId: number) {
    const idx = step2Rows.findIndex(r => r.applicant.id === applicantId)
    if (idx >= 0) step2Rows.splice(idx, 1)
    selected.value.delete(applicantId)
    if (step2Rows.length === 0) step.value = 1
}

const canGoToStep3 = computed(() =>
    entryPeriodId.value !== null
    && step2Rows.length > 0
    && step2Rows.every(r => r.offerKey !== null),
)

// ── Paso 2 → 3 (preview) ────────────────────────────────────────────
function rowsToItems() {
    return step2Rows.map(r => {
        const o = r.options.find(opt => opt.key === r.offerKey)!
        return {
            applicant_id:   r.applicant.id,
            study_plan_id:  o.studyPlanId,
            modality_id:    o.modalityId,
            current_period_number: 1,
        }
    })
}

async function goToStep3() {
    if (!canGoToStep3.value) return
    step.value = 3
    previewLoading.value = true
    bulkError.value = ''
    try {
        const { data } = await api.post<PreviewItem[]>(API.SCHOOL_SERVICES_API.students.enrollPreview, {
            entry_period_id: entryPeriodId.value,
            items:           rowsToItems(),
        })
        previewItems.value = data
    } catch (e: any) {
        bulkError.value = e?.response?.data?.message ?? 'Error al generar preview.'
        previewItems.value = []
    } finally {
        previewLoading.value = false
    }
}

// ── Paso 3 → 4 (confirmar) ──────────────────────────────────────────
async function confirmEnroll() {
    if (previewFailed.value.length > 0 || previewOk.value.length === 0) return
    confirming.value = true
    bulkError.value = ''
    try {
        const { data } = await api.post<{ enrolled: EnrolledResult[] }>(
            API.SCHOOL_SERVICES_API.students.enrollBulk,
            { entry_period_id: entryPeriodId.value, items: rowsToItems() },
        )
        enrolledResult.value = data.enrolled
        step.value = 4
    } catch (e: any) {
        if (e?.response?.status === 422 && Array.isArray(e.response.data?.failed)) {
            // Algún item cambió de estado entre preview y confirm — refrescar preview.
            bulkError.value = e.response.data.message ?? 'Falló la validación al confirmar. Revisa los problemas.'
            previewItems.value = e.response.data.failed.map((f: any) => ({
                applicantId: f.applicantId,
                ok:          false,
                reason:      f.reason,
                preview:     { numControl: null, fullName: nameByApplicantId.value.get(f.applicantId) ?? null, careerName: null, modalityName: null, periodName: null, currentPeriodNumber: 1 },
            }))
        } else {
            bulkError.value = e?.response?.data?.message ?? 'Error al inscribir.'
        }
    } finally {
        confirming.value = false
    }
}

function resetWizard() {
    step.value = 1
    selected.value = new Set()
    step2Rows.splice(0, step2Rows.length)
    previewItems.value = []
    enrolledResult.value = []
    bulkError.value = ''
    entryPeriodId.value = null
    items.value = []
    filterPeriodId.value = null
    totalItems.value = 0
    totalPages.value = 0
}
</script>
