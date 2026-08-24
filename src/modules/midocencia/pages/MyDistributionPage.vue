<template>
    <div class="space-y-4 max-w-5xl mx-auto pb-16">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Mi Docencia</h1>
                <p class="text-sm text-slate-500">Distribuye tus horas de función académica (descarga) en la rúbrica vigente.</p>
            </div>
            <div class="flex items-center gap-2">
                <button
                    v-if="request && ['submitted','approved'].includes(request.status)"
                    class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                    @click="goToEvidences">
                    Mis evidencias
                </button>
                <span v-if="request" class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="statusClass">
                    {{ statusLabel }}
                </span>
            </div>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{{ error }}</div>

        <template v-else>
            <!-- Sin plaza capturada -->
            <div v-if="!budget?.plazaAssigned" class="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800">
                Aún no se han capturado tus <strong>horas de plaza</strong> para este periodo. No puedes distribuir tu descarga todavía.
            </div>

            <template v-else>
                <!-- Resumen de presupuesto -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div class="bg-white border rounded-xl p-3">
                        <p class="text-[11px] uppercase text-slate-400 font-semibold">Plaza</p>
                        <p class="text-lg font-bold text-slate-800">{{ fmt(budget.plazaHours) }}</p>
                    </div>
                    <div class="bg-white border rounded-xl p-3">
                        <p class="text-[11px] uppercase text-slate-400 font-semibold">Frente a grupo</p>
                        <p class="text-lg font-bold text-slate-800">{{ fmt(budget.frontOfGroupHours) }}</p>
                    </div>
                    <div class="bg-white border rounded-xl p-3">
                        <p class="text-[11px] uppercase text-slate-400 font-semibold">Descarga a distribuir</p>
                        <p class="text-lg font-bold text-indigo-700">{{ fmt(budget.dischargeHours) }}</p>
                    </div>
                    <div class="bg-white border rounded-xl p-3" :class="remaining === 0 ? 'ring-1 ring-emerald-300' : ''">
                        <p class="text-[11px] uppercase text-slate-400 font-semibold">Restante</p>
                        <p class="text-lg font-bold" :class="remaining === 0 ? 'text-emerald-600' : 'text-amber-600'">{{ fmt(remaining) }}</p>
                    </div>
                </div>

                <div v-if="request?.status === 'rejected' && request?.rejectedReason"
                     class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <strong>Rechazada:</strong> {{ request.rejectedReason }}
                </div>
                <div v-if="request?.status === 'approved'"
                     class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 flex items-center justify-between gap-3 flex-wrap">
                    <span>Aprobada. Folio: <strong>{{ request.folio }}</strong></span>
                    <div class="flex gap-2">
                        <button
                            class="px-3 py-1.5 text-xs rounded-lg bg-slate-700 text-white hover:bg-slate-800"
                            @click="goToSchedule">
                            Colocar horario
                        </button>
                        <button
                            class="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                            :disabled="oficioBusy" @click="downloadOficio">
                            {{ oficioBusy ? 'Generando…' : 'Descargar oficio' }}
                        </button>
                    </div>
                </div>

                <!-- Renglones bloqueados (TUTORÍA GRUPAL) -->
                <div v-if="lockedRows.length" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div class="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold text-sm">
                        Asignado por la jefatura (no editable)
                    </div>
                    <div class="divide-y">
                        <div v-for="lr in lockedRows" :key="lr.rubricCriterionId" class="p-3 flex items-start justify-between gap-3">
                            <div>
                                <p class="text-sm font-medium text-slate-800">{{ criterionName(lr.rubricCriterionId) }}</p>
                                <p class="text-xs text-slate-500">{{ lr.subjects.join(', ') }}</p>
                            </div>
                            <span class="shrink-0 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-semibold">{{ fmt(lr.hours) }} hrs</span>
                        </div>
                    </div>
                </div>

                <!-- Rúbrica editable -->
                <div v-if="tree" class="space-y-4">
                    <div v-for="rubro in tree.rubros" :key="rubro.id" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                        <div class="px-4 py-2.5 bg-slate-800 text-white font-bold text-sm uppercase">{{ rubro.name }}</div>
                        <div class="divide-y">
                            <div v-for="crit in rubro.criteria" :key="crit.id" class="p-4"
                                 :class="isLocked(crit.id) ? 'bg-slate-50/60' : ''">
                                <div class="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 class="font-semibold text-slate-800">{{ crit.name }}</h3>
                                        <p class="text-xs text-slate-400">Rango: {{ crit.hoursMin }}–{{ crit.hoursMax }} hrs</p>
                                    </div>
                                    <div class="shrink-0 text-right">
                                        <template v-if="isLocked(crit.id)">
                                            <span class="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-xs font-semibold">bloqueado</span>
                                        </template>
                                        <template v-else>
                                            <label class="block text-[10px] uppercase text-slate-400 font-semibold mb-1">Horas</label>
                                            <input v-model.number="form[crit.id].hours" type="number" min="0" :max="crit.hoursMax"
                                                   :disabled="!editable"
                                                   class="w-20 border rounded-lg px-2 py-1 text-sm text-right disabled:bg-slate-100" />
                                        </template>
                                    </div>
                                </div>

                                <!-- Productos / evidencias (solo criterios editables con horas) -->
                                <div v-if="!isLocked(crit.id) && form[crit.id].hours > 0" class="mt-3 grid md:grid-cols-2 gap-4">
                                    <div v-if="crit.products.length">
                                        <p class="text-[11px] font-semibold text-slate-400 uppercase mb-1">Productos</p>
                                        <label v-for="p in crit.products" :key="p.id" class="flex items-start gap-2 text-sm text-slate-600 mb-1">
                                            <input type="checkbox" :value="p.id" v-model="form[crit.id].products" :disabled="!editable" class="mt-1" />
                                            <span>{{ p.name }}</span>
                                        </label>
                                    </div>
                                    <div v-if="crit.evidences.length">
                                        <p class="text-[11px] font-semibold text-slate-400 uppercase mb-1">Evidencias</p>
                                        <label v-for="e in crit.evidences" :key="e.id" class="flex items-start gap-2 text-sm text-slate-600 mb-1">
                                            <input type="checkbox" :value="e.id" v-model="form[crit.id].evidences" :disabled="!editable" class="mt-1" />
                                            <span>{{ e.name }}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center py-8 text-slate-400">No hay una rúbrica vigente para este periodo.</div>

                <!-- Acciones -->
                <div class="sticky bottom-0 bg-white/90 backdrop-blur border rounded-xl p-3 flex flex-wrap items-center gap-2">
                    <span class="text-sm text-slate-600 mr-auto">
                        Suma: <strong>{{ fmt(currentSum) }}</strong> / {{ fmt(budget.dischargeHours) }} hrs
                    </span>
                    <template v-if="editable">
                        <button class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            :disabled="busy" @click="save">Guardar borrador</button>
                        <button class="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                            :disabled="busy || remaining !== 0" @click="submit">Enviar a revisión</button>
                    </template>
                    <button v-else-if="request?.status === 'submitted'"
                        class="px-3 py-1.5 text-sm rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                        :disabled="busy" @click="retract">Regresar a edición</button>
                </div>
            </template>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useReportGenerator } from '@/modules/reports/composables/useReportGenerator'
import type { Budget, DistributionRequest, LockedRow } from '@/modules/midocencia/types/distribution.type'
import type { RubricTree, RubricCriterion } from '@/modules/midocencia/types/rubric.type'

const toast = useToast()
const router = useRouter()
const { downloadFromContext } = useReportGenerator()

function goToSchedule() {
    router.push({ name: 'midocencia.my-schedule' })
}
function goToEvidences() {
    router.push({ name: 'midocencia.my-evidences' })
}
const D = API.MIDOCENCIA_API.distribution

const oficioBusy = ref(false)
async function downloadOficio() {
    oficioBusy.value = true
    try {
        const { data } = await api.get(D.oficio)
        await downloadFromContext({ reportCode: data.reportCode, context: data.context, filename: 'OFICIO_FUNCION_ACADEMICA' })
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo generar el oficio.')
    } finally { oficioBusy.value = false }
}

const loading = ref(true)
const busy = ref(false)
const error = ref('')
const periodId = ref<number | null>(null)
const budget = ref<Budget | null>(null)
const tree = ref<RubricTree | null>(null)
const request = ref<DistributionRequest | null>(null)
const editable = ref(false)

const form = reactive<Record<number, { hours: number; products: number[]; evidences: number[] }>>({})

const lockedRows = computed<LockedRow[]>(() => budget.value?.lockedRows ?? [])
const lockedSet = computed(() => new Set(lockedRows.value.map(r => r.rubricCriterionId)))
function isLocked(criterionId: number) { return lockedSet.value.has(criterionId) }

const criterionIndex = computed(() => {
    const m = new Map<number, RubricCriterion>()
    tree.value?.rubros.forEach(r => r.criteria.forEach(c => m.set(c.id, c)))
    return m
})
function criterionName(id: number) { return criterionIndex.value.get(id)?.name ?? `Criterio #${id}` }

const lockedSum = computed(() => lockedRows.value.reduce((a, r) => a + Number(r.hours), 0))
const teacherSum = computed(() =>
    Object.entries(form).reduce((a, [cid, v]) => a + (isLocked(Number(cid)) ? 0 : Number(v.hours) || 0), 0))
const currentSum = computed(() => teacherSum.value + lockedSum.value)
const remaining = computed(() => Number(((budget.value?.dischargeHours ?? 0) - currentSum.value).toFixed(2)))

const statusLabel = computed(() => ({
    draft: 'Borrador', submitted: 'En revisión', approved: 'Aprobada', rejected: 'Rechazada',
}[request.value?.status ?? 'draft']))
const statusClass = computed(() => ({
    draft: 'bg-slate-100 text-slate-600', submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700',
}[request.value?.status ?? 'draft']))

function fmt(n: number | null | undefined) { return n === null || n === undefined ? '—' : Number(n).toFixed(n % 1 === 0 ? 0 : 1) }

onMounted(load)

async function load() {
    loading.value = true
    error.value = ''
    try {
        const { data } = await api.get(D.show)
        periodId.value = data.collegeAcademicPeriodId
        budget.value = data.budget
        tree.value = data.tree
        request.value = data.request
        editable.value = data.editable
        buildForm()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar tu distribución.'
    } finally {
        loading.value = false
    }
}

function buildForm() {
    Object.keys(form).forEach(k => delete form[Number(k)])
    const details = request.value?.details ?? []
    const byCrit = new Map(details.filter(d => d.origin === 'teacher').map(d => [d.rubricCriterionId, d]))
    tree.value?.rubros.forEach(r => r.criteria.forEach(c => {
        if (isLocked(c.id)) return
        const d = byCrit.get(c.id)
        form[c.id] = {
            hours: d ? Number(d.hours) : 0,
            products: d ? [...d.selectedProducts] : [],
            evidences: d ? [...d.selectedEvidences] : [],
        }
    }))
}

function payloadDetails() {
    return Object.entries(form)
        .filter(([cid, v]) => !isLocked(Number(cid)) && Number(v.hours) > 0)
        .map(([cid, v]) => ({
            rubric_criterion_id: Number(cid),
            hours: Number(v.hours),
            selected_products: v.products,
            selected_evidences: v.evidences,
        }))
}

async function save() {
    busy.value = true
    try {
        await api.post(D.save, { period_id: periodId.value, details: payloadDetails() })
        toast.success('Borrador guardado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo guardar.') }
    finally { busy.value = false }
}

async function submit() {
    busy.value = true
    try {
        await api.post(D.save, { period_id: periodId.value, details: payloadDetails() })
        await api.post(D.submit, { period_id: periodId.value })
        toast.success('Distribución enviada a revisión.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo enviar.') }
    finally { busy.value = false }
}

async function retract() {
    busy.value = true
    try {
        await api.post(D.retract, { period_id: periodId.value })
        toast.success('Regresada a edición.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo retractar.') }
    finally { busy.value = false }
}
</script>
