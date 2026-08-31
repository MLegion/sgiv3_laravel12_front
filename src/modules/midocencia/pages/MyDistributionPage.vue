<template>
    <div class="space-y-4 max-w-5xl mx-auto pb-16">
        <div class="flex items-start justify-between flex-wrap gap-3">
            <div>
                <h1 class="text-2xl font-bold text-slate-800">Mi Docencia · Horas de función académica</h1>
                <p class="text-sm text-slate-500">Marca los criterios de la rúbrica que vas a cumplir y asígnales horas dentro de su rango. La suma debe ser <strong>exactamente</strong> tu total de horas de descarga.</p>
            </div>
            <button
                class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                @click="goToOtros">
                Otros
            </button>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{{ error }}</div>

        <template v-else>
            <!-- Sin plaza capturada -->
            <div v-if="!budget?.plazaAssigned" class="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800">
                Aún no se han capturado tus <strong>horas de plaza</strong> para este periodo. No puedes distribuir tu descarga todavía.
            </div>

            <template v-else>
                <!-- Presupuesto de horas (barra) -->
                <div class="bg-white border rounded-xl shadow-sm p-5 space-y-3">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                        <span class="text-sm text-slate-600 inline-flex items-center gap-1.5">
                            <span>🗓</span> {{ periodName || 'Periodo vigente' }}
                        </span>
                        <span v-if="request" class="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1" :class="statusClass">
                            <span v-if="request.status === 'approved'">✔</span>{{ statusLabel }}
                        </span>
                    </div>
                    <div class="flex items-end justify-between">
                        <span class="text-[11px] uppercase text-slate-400 font-semibold tracking-wide">Presupuesto de horas</span>
                        <span class="text-sm text-slate-500">
                            <strong class="text-2xl text-slate-800">{{ fmt(currentSum) }}</strong> / {{ fmt(budget.dischargeHours) }} h asignadas
                        </span>
                    </div>
                    <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div class="h-full rounded-full transition-all" :class="barClass" :style="{ width: barPct + '%' }"></div>
                    </div>
                    <p class="text-sm inline-flex items-center gap-1.5" :class="remaining === 0 ? 'text-emerald-600' : (remaining > 0 ? 'text-amber-600' : 'text-red-600')">
                        <template v-if="remaining === 0">✔ Suma exacta: <strong>{{ fmt(currentSum) }} h</strong>. Listo para enviar.</template>
                        <template v-else-if="remaining > 0">Faltan <strong>{{ fmt(remaining) }} h</strong> por asignar.</template>
                        <template v-else>Te pasaste <strong>{{ fmt(-remaining) }} h</strong> del presupuesto.</template>
                    </p>
                </div>

                <!-- Banners de estado -->
                <div v-if="request?.status === 'approved'"
                     class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800">
                    <p class="font-semibold flex items-center gap-1.5">✔ Aprobada</p>
                    <p class="text-sm">Ya puedes imprimir tu oficio.<span v-if="request.folio"> Folio: <strong>{{ request.folio }}</strong></span></p>
                </div>
                <div v-if="request?.status === 'rejected' && request?.rejectedReason"
                     class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <strong>Rechazada:</strong> {{ request.rejectedReason }}
                </div>

                <template v-if="tree">
                    <!-- Pestañas por rubro -->
                    <div class="flex flex-wrap gap-1 border-b">
                        <button v-for="rubro in tree.rubros" :key="rubro.id"
                            class="px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors inline-flex items-center gap-2"
                            :class="rubro.id === activeRubroId ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'"
                            @click="activeRubroId = rubro.id">
                            {{ rubro.name }}
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  :class="rubro.id === activeRubroId ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'">
                                {{ rubroRange(rubro) }}
                            </span>
                        </button>
                    </div>

                    <!-- Criterios del rubro activo -->
                    <div class="space-y-3">
                        <div v-for="crit in activeCriteria" :key="crit.id"
                             class="bg-white border rounded-xl shadow-sm overflow-hidden"
                             :class="isChecked(crit) ? 'border-l-4 border-l-emerald-500' : ''">
                            <!-- Cabecera del criterio -->
                            <div class="px-4 py-3 flex items-start justify-between gap-3">
                                <label class="flex items-start gap-2.5 cursor-pointer" :class="disabled(crit) ? 'cursor-default' : ''">
                                    <input type="checkbox" class="mt-1"
                                        :checked="isChecked(crit)"
                                        :disabled="disabled(crit)"
                                        @change="toggleCriterion(crit)" />
                                    <span class="font-semibold text-slate-800">{{ crit.name }}</span>
                                </label>
                                <div class="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
                                    <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                                          :class="isLocked(crit.id) ? 'bg-emerald-100 text-emerald-700' : (isChecked(crit) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')">
                                        {{ isLocked(crit.id) ? 'Asignado' : (isChecked(crit) ? 'Incluido' : 'Opcional') }}
                                    </span>
                                    <span v-if="isLocked(crit.id)" class="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-semibold inline-flex items-center gap-1">
                                        🔒 Asignado por jefatura ({{ fmt(lockedHours(crit.id)) }} h)
                                    </span>
                                    <template v-if="isFixed(crit)">
                                        <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">{{ fmt(crit.hoursMax) }} h fijo</span>
                                    </template>
                                    <template v-else-if="isChecked(crit) && !isLocked(crit.id)">
                                        <span class="text-[10px] uppercase text-slate-400 font-semibold">Horas</span>
                                        <input v-model.number="form[crit.id].hours" type="number" :min="crit.hoursMin" :max="crit.hoursMax"
                                               :disabled="!editable"
                                               class="w-16 border rounded-lg px-2 py-1 text-sm text-right disabled:bg-slate-100" />
                                        <span class="text-[10px] text-slate-400">/ {{ crit.hoursMin }}–{{ crit.hoursMax }}</span>
                                    </template>
                                </div>
                            </div>

                            <!-- Productos / evidencias (visibles al marcar el criterio) -->
                            <div v-if="isChecked(crit)" class="px-4 pb-4 grid md:grid-cols-2 gap-5 bg-slate-50/40 border-t pt-3">
                                <div v-if="crit.products.length">
                                    <p class="text-[11px] font-semibold text-slate-400 uppercase mb-2">
                                        Producto a obtener <span class="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">Mín. 1</span>
                                    </p>
                                    <label v-for="p in crit.products" :key="p.id" class="flex items-start gap-2 text-sm mb-2"
                                           :class="disabled(crit) ? '' : 'cursor-pointer'">
                                        <input type="checkbox" class="mt-1"
                                            :checked="isProdChecked(crit, p)"
                                            :disabled="disabled(crit)" @change="toggleProduct(crit, p)" />
                                        <span class="text-slate-600">{{ p.name }}</span>
                                    </label>
                                </div>
                                <div v-if="crit.evidences.length">
                                    <p class="text-[11px] font-semibold text-slate-400 uppercase mb-2">Evidencia</p>
                                    <div v-for="e in crit.evidences" :key="e.id" class="flex items-start justify-between gap-2 mb-2"
                                         :class="isPaired(e) ? 'opacity-70' : ''">
                                        <label class="flex items-start gap-2 text-sm" :class="(disabled(crit) || isPaired(e)) ? '' : 'cursor-pointer'">
                                            <input type="checkbox" class="mt-1"
                                                :checked="isEviChecked(crit, e)"
                                                :disabled="disabled(crit) || isPaired(e)"
                                                @change="toggleSharedEvidence(crit, e)" />
                                            <span>
                                                <span class="text-slate-600">{{ e.name }}</span>
                                                <span v-if="isPaired(e)" class="block text-[10px] text-slate-400 uppercase tracking-wide">↳ Sigue al producto</span>
                                            </span>
                                        </label>
                                        <span class="shrink-0 mt-0.5 px-1.5 py-0.5 rounded border text-[11px] text-slate-500 inline-flex items-center gap-1">📎 0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
                <div v-else class="text-center py-8 text-slate-400">No hay una rúbrica vigente para este periodo.</div>

                <!-- Acciones -->
                <div class="sticky bottom-0 bg-white/90 backdrop-blur border rounded-xl p-3 flex flex-wrap items-center gap-2">
                    <span class="text-sm mr-auto">
                        <span v-if="criteriaMissingProduct.length" class="text-red-600">Falta producto en {{ criteriaMissingProduct.length }} criterio(s)</span>
                        <span v-else-if="remaining === 0" class="text-emerald-600">✓ {{ fmt(currentSum) }} h · listo para enviar</span>
                        <span v-else class="text-slate-500">{{ fmt(currentSum) }} / {{ fmt(budget.dischargeHours) }} h</span>
                    </span>
                    <button v-if="editable"
                        class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        :disabled="busy" @click="save">Guardar borrador</button>
                    <button v-if="editable"
                        class="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        :disabled="busy || remaining !== 0 || criteriaMissingProduct.length > 0" @click="submit">Enviar a revisión</button>
                    <button v-if="request?.status === 'submitted'"
                        class="px-3 py-1.5 text-sm rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                        :disabled="busy" @click="retract">Regresar a edición</button>
                    <button v-if="request?.status === 'approved'"
                        class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                        @click="goToSchedule">Colocar horario</button>
                    <button
                        class="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 inline-flex items-center gap-1"
                        :disabled="oficioBusy || request?.status !== 'approved'" @click="downloadOficio">
                        🖨 {{ oficioBusy ? 'Generando…' : 'Imprimir oficio' }}
                    </button>
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
import type { RubricTree, RubricCriterion, RubricRubro, RubricEvidence } from '@/modules/midocencia/types/rubric.type'

const toast = useToast()
const router = useRouter()
const { downloadFromContext } = useReportGenerator()

function goToSchedule() { router.push({ name: 'midocencia.my-schedule' }) }
function goToOtros() { router.push({ name: 'midocencia.my-otros' }) }
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
const periodName = ref<string>('')
const budget = ref<Budget | null>(null)
const tree = ref<RubricTree | null>(null)
const request = ref<DistributionRequest | null>(null)
const editable = ref(false)
const activeRubroId = ref<number | null>(null)

const form = reactive<Record<number, { hours: number; products: number[]; evidences: number[] }>>({})

const lockedRows = computed<LockedRow[]>(() => budget.value?.lockedRows ?? [])
const lockedSet = computed(() => new Set(lockedRows.value.map(r => r.rubricCriterionId)))
function isLocked(criterionId: number) { return lockedSet.value.has(criterionId) }
function lockedHours(criterionId: number) { return Number(lockedRows.value.find(r => r.rubricCriterionId === criterionId)?.hours ?? 0) }

const activeCriteria = computed<RubricCriterion[]>(() =>
    tree.value?.rubros.find(r => r.id === activeRubroId.value)?.criteria ?? [])

function rubroRange(rubro: RubricRubro) {
    if (!rubro.criteria.length) return ''
    const min = Math.min(...rubro.criteria.map(c => c.hoursMin))
    const max = Math.max(...rubro.criteria.map(c => c.hoursMax))
    return `${min}·${max} h`
}

function isFixed(crit: RubricCriterion) { return crit.hoursMin === crit.hoursMax }
function isChecked(crit: RubricCriterion) { return isLocked(crit.id) || (Number(form[crit.id]?.hours) || 0) > 0 }
function disabled(crit: RubricCriterion) { return isLocked(crit.id) || !editable.value }

function isPaired(e: RubricEvidence) { return e.productId != null }
function sharedEvidences(crit: RubricCriterion) { return crit.evidences.filter(e => !isPaired(e)) }

/** Habilitar/deshabilitar un criterio (checkbox "usar"). Réplica de onUsar de SGIv2. */
function toggleCriterion(crit: RubricCriterion) {
    if (disabled(crit)) return
    const f = form[crit.id]
    if (!f) return
    if ((Number(f.hours) || 0) > 0) {
        // Deshabilitar: solo apaga las horas; conserva la selección (como el DOM de v2).
        f.hours = 0
    } else {
        f.hours = isFixed(crit) ? crit.hoursMin : (Number(f.hours) || crit.hoursMin)
        ensureMinimums(crit)
    }
}

/** Al habilitar: ≥1 producto y ≥1 evidencia compartida; sincroniza las pareadas. */
function ensureMinimums(crit: RubricCriterion) {
    const f = form[crit.id]
    if (!f) return
    if (f.products.length === 0 && crit.products.length) f.products = crit.products.map(p => p.id)
    sincronizarPareadas(crit)
    const shared = sharedEvidences(crit)
    if (shared.length && !shared.some(e => f.evidences.includes(e.id))) f.evidences.push(shared[0].id)
}

/** La evidencia PAREADA espeja el estado de su producto (se marca/desmarca sola). */
function sincronizarPareadas(crit: RubricCriterion) {
    const f = form[crit.id]
    if (!f) return
    crit.evidences.forEach(e => {
        if (!isPaired(e)) return
        const shouldOn = f.products.includes(e.productId as number)
        const idx = f.evidences.indexOf(e.id)
        if (shouldOn && idx < 0) f.evidences.push(e.id)
        if (!shouldOn && idx >= 0) f.evidences.splice(idx, 1)
    })
}

/** Producto: mínimo 1; al cambiar, sincroniza sus evidencias pareadas. Réplica de onProducto. */
function toggleProduct(crit: RubricCriterion, product: { id: number }) {
    if (disabled(crit)) return
    const f = form[crit.id]
    if (!f) return
    if (f.products.includes(product.id)) {
        if (f.products.length <= 1) { toast.error('Debes dejar al menos un producto a obtener en este criterio.'); return }
        f.products = f.products.filter(id => id !== product.id)
    } else {
        f.products.push(product.id)
    }
    sincronizarPareadas(crit)
}

/** Evidencia COMPARTIDA (toggleable): mínimo 1. Réplica de onEvidenciaCompartida. */
function toggleSharedEvidence(crit: RubricCriterion, e: RubricEvidence) {
    if (disabled(crit)) return
    const f = form[crit.id]
    if (!f) return
    const idx = f.evidences.indexOf(e.id)
    if (idx >= 0) {
        const checkedShared = sharedEvidences(crit).filter(x => f.evidences.includes(x.id))
        if (checkedShared.length <= 1) { toast.error('Debes dejar al menos una evidencia en este criterio.'); return }
        f.evidences.splice(idx, 1)
    } else {
        f.evidences.push(e.id)
    }
}

function isEviChecked(crit: RubricCriterion, e: RubricEvidence) { return form[crit.id]?.evidences.includes(e.id) ?? false }
function isProdChecked(crit: RubricCriterion, p: { id: number }) { return form[crit.id]?.products.includes(p.id) ?? false }

/** Criterio habilitado sin ningún producto (no debería pasar por el mínimo 1). */
const criteriaMissingProduct = computed(() =>
    (tree.value?.rubros.flatMap(r => r.criteria) ?? []).filter(c =>
        isChecked(c) && !isLocked(c.id) && c.products.length > 0 && (form[c.id]?.products.length ?? 0) === 0))

const teacherSum = computed(() =>
    Object.entries(form).reduce((a, [cid, v]) => a + (isLocked(Number(cid)) ? 0 : Number(v.hours) || 0), 0))
const lockedSum = computed(() => lockedRows.value.reduce((a, r) => a + Number(r.hours), 0))
const currentSum = computed(() => teacherSum.value + lockedSum.value)
const remaining = computed(() => Number(((budget.value?.dischargeHours ?? 0) - currentSum.value).toFixed(2)))

const barPct = computed(() => {
    const d = budget.value?.dischargeHours ?? 0
    if (d <= 0) return 0
    return Math.min(100, Math.round((currentSum.value / d) * 100))
})
const barClass = computed(() => remaining.value === 0 ? 'bg-emerald-500' : (remaining.value > 0 ? 'bg-amber-400' : 'bg-red-500'))

const statusLabel = computed(() => ({
    draft: 'Borrador', submitted: 'En revisión', approved: 'Aprobado', rejected: 'Rechazada',
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
        periodName.value = data.periodName ?? ''
        budget.value = data.budget
        tree.value = data.tree
        request.value = data.request
        editable.value = data.editable
        buildForm()
        if (!activeRubroId.value && tree.value?.rubros.length) activeRubroId.value = tree.value.rubros[0].id
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar tu distribución.'
    } finally {
        loading.value = false
    }
}

function buildForm() {
    Object.keys(form).forEach(k => delete form[Number(k)])
    const details = request.value?.details ?? []
    const byCrit = new Map(details.map(d => [d.rubricCriterionId, d]))
    tree.value?.rubros.forEach(r => r.criteria.forEach(c => {
        const d = byCrit.get(c.id)
        const lr = lockedRows.value.find(l => l.rubricCriterionId === c.id)
        if (d) {
            // Selección guardada.
            form[c.id] = { hours: lr ? Number(lr.hours) : Number(d.hours), products: [...d.selectedProducts], evidences: [...d.selectedEvidences] }
        } else {
            // Criterio nuevo: default de SGIv2 = todos los productos y evidencias marcados
            // (el docente destildar lo que no cumpla, respetando los mínimos).
            form[c.id] = { hours: lr ? Number(lr.hours) : 0, products: c.products.map(p => p.id), evidences: c.evidences.map(e => e.id) }
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
    if (criteriaMissingProduct.value.length) {
        toast.error(`Selecciona al menos un producto en: ${criteriaMissingProduct.value.map(c => c.name).join(', ')}.`)
        return
    }
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
