<template>
    <div class="space-y-4 max-w-6xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Seguimiento de descargas</h1>
            <p class="text-sm text-slate-500">Recorrido de cada docente de tu división, de principio a fin<span v-if="periodName"> · {{ periodName }}</span>.</p>
        </div>

        <!-- Periodo -->
        <div class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3">
            <div class="w-72">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Periodo</label>
                <FormRemoteSelect
                    v-model="periodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.byId"
                    :params="{ order_by: 'actual_start_date', order_dir: 'desc', per_page: 100 }"
                    :item-label="periodLabel"
                    :item-searchs="['name']"
                    item-value="id"
                    placeholder="Selecciona un periodo…"
                    @update:model-value="onPeriodChange"
                />
            </div>
        </div>

        <template v-if="periodId">
            <!-- Tabs por acción -->
            <div class="flex flex-wrap gap-2">
                <button v-for="t in tabs" :key="t.key"
                    class="px-3.5 py-1.5 rounded-full text-sm font-semibold border transition inline-flex items-center gap-2"
                    :class="tab === t.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
                    @click="tab = t.key">
                    <span class="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-xs"
                          :class="tab === t.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'">{{ t.count }}</span>
                    <span v-if="t.key === 'revisar'">⚡</span>{{ t.label }}
                </button>
            </div>

            <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
            <div v-else-if="visibleRows.length === 0" class="text-center py-8 text-slate-400">Sin docentes en este filtro.</div>

            <!-- Tabla -->
            <div v-else class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-slate-400 text-xs uppercase tracking-wide">
                        <tr>
                            <th class="text-left px-4 py-3">Docente</th>
                            <th class="text-left px-4 py-3">Distribución</th>
                            <th class="text-left px-4 py-3">Horario</th>
                            <th class="text-left px-4 py-3">Oficio</th>
                            <th class="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="r in visibleRows" :key="r.id" class="hover:bg-slate-50"
                            :class="bucketOf(r) === 'revisar' ? 'border-l-4 border-l-blue-500' : ''">
                            <td class="px-4 py-3">
                                <p class="font-semibold text-slate-800 inline-flex items-center gap-1.5">🎓 {{ teacherLabel(r) }}</p>
                                <p class="text-xs text-slate-400">{{ fmt(totalHours(r)) }} h de descarga</p>
                            </td>
                            <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-semibold" :class="distChip(r).cls">{{ distChip(r).text }}</span></td>
                            <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-semibold" :class="horChip(r).cls">{{ horChip(r).text }}</span></td>
                            <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-semibold" :class="ofiChip(r).cls">{{ ofiChip(r).text }}</span></td>
                            <td class="px-4 py-3 text-right">
                                <button v-for="b in actionButtons(r)" :key="b.key"
                                    class="ml-1 px-2.5 py-1.5 text-xs rounded-lg inline-flex items-center gap-1"
                                    :class="b.primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'"
                                    :disabled="b.key === 'oficio' && oficioBusyId === r.id"
                                    @click="b.action(r)">
                                    <span>{{ b.icon }}</span>{{ b.key === 'oficio' && oficioBusyId === r.id ? 'Generando…' : b.label }}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>
        <div v-else class="text-center py-8 text-slate-400">Selecciona un periodo para ver el seguimiento.</div>

        <!-- Modal de revisión de distribución -->
        <DescargaReviewModal
            v-if="reviewing"
            :request="reviewing"
            :teacher-name="teacherLabel(reviewing)"
            @close="reviewing = null"
            @changed="onReviewed" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useReportGenerator } from '@/modules/reports/composables/useReportGenerator'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import DescargaReviewModal from '@/modules/midocencia/components/DescargaReviewModal.vue'
import type { DistributionRequest } from '@/modules/midocencia/types/distribution.type'

const toast = useToast()
const router = useRouter()
const { downloadFromContext } = useReportGenerator()
const A = API.MIDOCENCIA_API.approval

const periodId = ref<number | null>(null)
const periodName = ref('')
const rows = ref<DistributionRequest[]>([])
const loading = ref(false)
const tab = ref<'revisar' | 'proceso' | 'fin' | 'todas'>('revisar')
const reviewing = ref<DistributionRequest | null>(null)
const oficioBusyId = ref<number | null>(null)

const teacherNames = ref<Record<number, string>>({})

// Persistencia de contexto: al recargar, restaurar periodo y pestaña para no
// sacar al usuario del componente ni obligarlo a re-seleccionar el periodo.
const LS_PERIOD = 'midocencia.approval.periodId'
const LS_TAB = 'midocencia.approval.tab'

onMounted(async () => {
    await loadTeachers()
    const savedTab = localStorage.getItem(LS_TAB)
    if (savedTab && ['revisar', 'proceso', 'fin', 'todas'].includes(savedTab)) {
        tab.value = savedTab as typeof tab.value
    }
    const savedPeriod = Number(localStorage.getItem(LS_PERIOD) || 0)
    if (savedPeriod > 0) {
        periodId.value = savedPeriod
        loadInbox()
    } else {
        // Sin periodo guardado: por defecto, el periodo ACTIVO del plantel.
        try {
            const { data } = await api.get(A.activePeriod)
            if (data?.id) {
                periodId.value = Number(data.id)
                localStorage.setItem(LS_PERIOD, String(data.id))
                loadInbox()
            }
        } catch { /* noop */ }
    }
})

watch(tab, (t) => localStorage.setItem(LS_TAB, t))

async function loadTeachers() {
    try {
        const { data } = await api.get(API.SCA_API.teachers.list, { params: { per_page: 1000 } })
        const items = data?.items ?? data?.data ?? data ?? []
        const map: Record<number, string> = {}
        for (const t of items) map[t.id] = t.displayName ?? t.name ?? `Docente #${t.id}`
        teacherNames.value = map
    } catch { /* noop */ }
}
// El listado trae `name` de primer nivel; el byId lo trae anidado en
// academicPeriod.name. Resolver ambos (nunca undefined) evita que el input
// quede vacío y que search.value.trim() reviente al enfocar.
function periodLabel(p: any): string { return p?.name ?? p?.academicPeriod?.name ?? '' }
// Prefiere el nombre que trae el inbox (join a employees); fallback al catálogo.
function teacherLabel(r: DistributionRequest): string {
    return (r as any).teacherName || teacherNames.value[r.teacherId] || `Docente #${r.teacherId}`
}
function fmt(n: number) { return Number(n).toFixed(Number(n) % 1 === 0 ? 0 : 1) }
function totalHours(r: DistributionRequest) { return r.details.reduce((a, d) => a + Number(d.hours), 0) }

// ── Bucket por acción (espejo de SGIv2) ──────────────────────────────
function bucketOf(r: DistributionRequest): 'revisar' | 'proceso' | 'fin' {
    if (r.status === 'submitted') return 'revisar'
    if (r.status === 'approved' && r.scheduleStatus === 'submitted') return 'revisar'
    if (r.status === 'approved' && r.scheduleStatus === 'approved') return 'fin'
    return 'proceso'
}

const tabs = computed(() => [
    { key: 'revisar' as const, label: 'Requieren tu revisión', count: rows.value.filter(r => bucketOf(r) === 'revisar').length },
    { key: 'proceso' as const, label: 'En proceso del docente', count: rows.value.filter(r => bucketOf(r) === 'proceso').length },
    { key: 'fin' as const, label: 'Finalizadas', count: rows.value.filter(r => bucketOf(r) === 'fin').length },
    { key: 'todas' as const, label: 'Todas', count: rows.value.length },
])
const visibleRows = computed(() => tab.value === 'todas' ? rows.value : rows.value.filter(r => bucketOf(r) === tab.value))

// ── Chips por etapa ──────────────────────────────────────────────────
function distChip(r: DistributionRequest) {
    return ({
        draft:     { text: 'Borrador', cls: 'bg-slate-100 text-slate-500' },
        submitted: { text: 'Por revisar', cls: 'bg-amber-100 text-amber-700' },
        rejected:  { text: 'Rechazada', cls: 'bg-red-100 text-red-700' },
        approved:  { text: 'Aprobada', cls: 'bg-emerald-100 text-emerald-700' },
    } as Record<string, { text: string; cls: string }>)[r.status] ?? { text: '—', cls: 'bg-slate-100 text-slate-400' }
}
function horChip(r: DistributionRequest) {
    if (r.status !== 'approved') return { text: '—', cls: 'bg-slate-100 text-slate-400' }
    return ({
        pending:   { text: 'Por colocar', cls: 'bg-slate-100 text-slate-500' },
        submitted: { text: 'Por revisar', cls: 'bg-amber-100 text-amber-700' },
        approved:  { text: 'Aprobado', cls: 'bg-emerald-100 text-emerald-700' },
    } as Record<string, { text: string; cls: string }>)[r.scheduleStatus] ?? { text: '—', cls: 'bg-slate-100 text-slate-400' }
}
function ofiChip(r: DistributionRequest) {
    if (r.status === 'approved' && r.scheduleStatus === 'approved') return { text: r.folio ?? 'Listo', cls: 'bg-emerald-100 text-emerald-700' }
    return { text: '—', cls: 'bg-slate-100 text-slate-400' }
}

// ── Botones de acción por fila ───────────────────────────────────────
interface ActionBtn { key: string; label: string; icon: string; primary: boolean; action: (r: DistributionRequest) => void }
function actionButtons(r: DistributionRequest): ActionBtn[] {
    if (r.status === 'submitted') return [{ key: 'rev-dist', label: 'Revisar', icon: '📌', primary: true, action: openReview }]
    if (r.status === 'approved' && r.scheduleStatus === 'submitted') return [{ key: 'rev-hor', label: 'Revisar', icon: '📌', primary: true, action: goSchedule }]
    if (r.status === 'approved' && r.scheduleStatus === 'approved') return [
        { key: 'oficio', label: 'Oficio', icon: '🖨', primary: false, action: downloadOficio },
        { key: 'ver-hor-fin', label: 'Ver horario', icon: '📅', primary: false, action: goSchedule },
    ]
    if (r.status === 'approved') return [{ key: 'ver-hor', label: 'Ver horario', icon: '📅', primary: false, action: goSchedule }]
    return [{ key: 'ver-dist', label: 'Ver', icon: '👁', primary: false, action: openReview }]
}

function openReview(r: DistributionRequest) { reviewing.value = r }
function goSchedule(r: DistributionRequest) { router.push({ name: 'midocencia.approval-schedule', params: { id: r.id } }) }
function onReviewed() { reviewing.value = null; loadInbox() }
function onPeriodChange() {
    localStorage.setItem(LS_PERIOD, String(periodId.value ?? ''))
    tab.value = 'revisar'
    loadInbox()
}

async function loadInbox() {
    if (!periodId.value) { rows.value = []; return }
    loading.value = true
    try {
        const { data } = await api.get(A.inbox, { params: { period_id: periodId.value, status: '' } })
        rows.value = Array.isArray(data) ? data : []
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo cargar el seguimiento.')
        rows.value = []
    } finally { loading.value = false }
}

async function downloadOficio(r: DistributionRequest) {
    oficioBusyId.value = r.id
    try {
        const { data } = await api.get(A.oficio(r.id))
        await downloadFromContext({ reportCode: data.reportCode, context: data.context, filename: 'OFICIO_FUNCION_ACADEMICA' })
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo generar el oficio.')
    } finally { oficioBusyId.value = null }
}
</script>
