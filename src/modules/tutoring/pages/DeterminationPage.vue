<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Determinación de tutoría individual</h1>
            <p class="text-xs text-slate-400">Ratifica a los sugeridos en riesgo o agrega manuales (Cap. 15).</p>
        </div>

        <!-- Estado de la ventana -->
        <div class="rounded-xl border p-3 text-sm flex items-center gap-3"
             :class="windowOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'">
            <span class="font-bold">{{ windowOpen ? '● Ventana abierta' : '○ Ventana cerrada' }}</span>
            <span class="text-slate-500" v-if="windowInfo">{{ windowInfo }}</span>
            <span v-if="!windowOpen" class="text-slate-500">— no se pueden registrar propuestas fuera de la ventana.</span>
        </div>

        <!-- Acción: abrir el buscador de candidatos -->
        <div class="flex gap-2">
            <button @click="openSearch"
                class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                Buscar candidatos
            </button>
        </div>

        <!-- Propuestas registradas -->
        <div class="flex items-center justify-between pt-2">
            <h2 class="text-sm font-bold uppercase text-slate-500">Propuestas registradas</h2>
            <button @click="fetchProposals" class="text-xs text-slate-400 hover:text-slate-600">Actualizar</button>
        </div>
        <div class="rounded-xl border bg-white overflow-hidden">
            <div role="region" aria-label="Propuestas registradas" tabindex="0" class="overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400">
            <table class="w-full text-sm">
                <caption class="sr-only">Propuestas registradas</caption>
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th scope="col" class="px-4 py-2">Alumno</th><th scope="col">Motivo</th><th scope="col">Origen</th><th scope="col">Estado</th><th scope="col">Tutor</th><th scope="col"></th>
                </tr></thead>
                <tbody>
                    <tr v-for="p in proposals" :key="p.id" class="border-b last:border-0">
                        <td class="px-4 py-2"><span class="font-semibold text-slate-700">{{ p.num_control }}</span> <span class="text-slate-500">{{ p.full_name }}</span></td>
                        <td class="text-slate-600 max-w-xs truncate" :title="p.reason">{{ p.reason }}</td>
                        <td><Sig :t="p.source === 'system' ? 'Riesgo' : 'Academia'" :tone="p.source === 'system' ? 'emerald' : 'slate'" /></td>
                        <td><PStatus :status="p.status" /></td>
                        <td class="text-slate-600">{{ p.tutor_name ?? '—' }}</td>
                        <td class="pr-3 text-right whitespace-nowrap">
                            <template v-if="p.status === 'open'">
                                <button @click="openConfirm(p)" class="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold">Confirmar</button>
                                <button @click="act(() => reject(p))" class="px-2 py-1 rounded border text-[11px] text-slate-600 ml-1">Rechazar</button>
                                <button @click="act(() => withdraw(p))" class="px-2 py-1 rounded border text-[11px] text-slate-600 ml-1">Retirar</button>
                            </template>
                            <button v-else-if="p.status === 'confirmed'" @click="openChangeTutor(p)"
                                class="px-2 py-1 rounded border text-[11px] text-slate-600 hover:bg-slate-100">Cambiar tutor</button>
                            <span v-else class="text-[11px] text-slate-400">—</span>
                        </td>
                    </tr>
                    <tr v-if="!proposals.length"><td colspan="6" class="px-4 py-6 text-center text-slate-400">Sin propuestas.</td></tr>
                </tbody>
            </table>
            </div>
        </div>

        <!-- Modal: BUSCADOR de candidatos (filtros + datatable) -->
        <BaseModal v-model="searchOpen" title="Buscar candidatos a tutoría individual" size="xl">
            <div class="space-y-4">
                <div class="grid sm:grid-cols-3 gap-3">
                    <select v-model="filters.period_id" @change="fetchWindow" aria-label="Filtrar por periodo" class="rounded-lg border-slate-300 text-sm">
                        <option value="">Periodo…</option>
                        <option v-for="p in options.periods" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                    <select v-model="filters.campus_id" @change="onCampusChange" aria-label="Filtrar por campus" class="rounded-lg border-slate-300 text-sm">
                        <option value="">Todos los campus</option>
                        <option v-for="c in options.campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                    </select>
                    <select v-model="filters.career_id" aria-label="Filtrar por carrera" class="rounded-lg border-slate-300 text-sm">
                        <option value="">Todas las carreras</option>
                        <option v-for="c in visibleCareers" :key="c.id" :value="c.id">{{ c.name }}</option>
                    </select>
                    <input v-model="filters.semester" type="number" min="1" placeholder="Semestre" aria-label="Semestre" class="rounded-lg border-slate-300 text-sm" />
                    <input v-model="filters.search" @keyup.enter="fetchRisk" placeholder="Nombre / nº control" aria-label="Buscar por nombre o número de control" class="rounded-lg border-slate-300 text-sm" />
                    <label class="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" v-model="filters.only_suggested" /> Solo sugeridos
                    </label>
                </div>
                <div class="flex items-center gap-2">
                    <button @click="fetchRisk" :disabled="riskLoading"
                        class="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50">
                        {{ riskLoading ? 'Buscando…' : 'Buscar' }}
                    </button>
                    <span class="text-xs text-slate-400">{{ risk.length }} candidato(s)</span>
                </div>

                <DataTable
                    :columns="riskColumns"
                    :rows="pagedRisk"
                    :pagination="riskPagination"
                    :loading="riskLoading"
                    hide-search
                    empty-text="Sin candidatos para los filtros (elige periodo y busca)."
                    @change="onRiskTableChange">
                    <template #cell-alumno="{ row }">
                        <span class="font-semibold text-slate-700">{{ row.num_control }}</span>
                        <span class="ml-2 text-slate-500">{{ row.full_name }}</span>
                    </template>
                    <template #cell-signals="{ row }">
                        <span class="space-x-1">
                            <Sig v-for="s in row.signals" :key="s.key" :t="sigText(s)" :tone="s.tone" />
                            <span v-if="!row.signals || !row.signals.length" class="text-slate-300">—</span>
                        </span>
                    </template>
                    <template #cell-suggested="{ row }"><Badge :ok="row.suggested" on="Sí" off="No" /></template>
                    <template #cell-acciones="{ row }">
                        <button @click="openPropose(row)" :disabled="!windowOpen"
                            class="px-3 py-1 rounded-lg border text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">Proponer</button>
                    </template>
                </DataTable>
                <p v-if="!windowOpen" class="text-[11px] text-amber-600">La ventana está cerrada: no se pueden registrar propuestas.</p>
            </div>
        </BaseModal>

        <!-- Modal proponer -->
        <BaseModal v-model="propose.open" :title="'Proponer: ' + (propose.row?.full_name ?? '')" size="md">
            <label for="propose-reason" class="block text-xs font-semibold text-slate-500 mb-1">Motivo</label>
            <textarea id="propose-reason" v-model="propose.reason" rows="3" class="w-full rounded-lg border-slate-300 text-sm" placeholder="Describe la razón de la tutoría individual…"></textarea>
            <p class="text-[11px] text-slate-400 mt-1">Origen: <b>{{ propose.row?.suggested ? 'sugerido por riesgo' : 'manual (academia)' }}</b></p>
            <template #footer>
                <button @click="submitPropose" :disabled="busy || !propose.reason.trim()" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Registrar propuesta</button>
            </template>
        </BaseModal>

        <!-- Modal confirmar (asignar tutor) -->
        <BaseModal v-model="confirmM.open" :title="'Confirmar: ' + (confirmM.row?.full_name ?? '')" size="md">
            <FormRemoteSelect
                v-model="confirmM.tutor"
                :endpoint="T.determination.personnel"
                :endpoint-by-id="T.determination.personnelById"
                item-value="user_id"
                item-label="full_name"
                :item-searchs="['full_name']"
                label="Tutor (personal del plantel)"
                placeholder="Buscar al tutor por nombre…" />
            <p class="text-[11px] text-slate-400 mt-1">Se creará/usará la asignación individual del tutor y se agregará al alumno.</p>
            <template #footer>
                <button @click="submitConfirm" :disabled="busy || !confirmM.tutor" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Confirmar y asignar</button>
            </template>
        </BaseModal>

        <!-- Modal cambiar tutor (propuesta confirmada) -->
        <BaseModal v-model="changeM.open" :title="'Cambiar tutor: ' + (changeM.row?.full_name ?? '')" size="md">
            <p class="text-[11px] text-slate-500 mb-2">Tutor actual: <b>{{ changeM.row?.tutor_name ?? '—' }}</b>. Se mueve SOLO a este alumno al nuevo tutor; los demás tutorados del tutor actual no se afectan.</p>
            <FormRemoteSelect
                v-model="changeM.tutor"
                :endpoint="T.determination.personnel"
                :endpoint-by-id="T.determination.personnelById"
                item-value="user_id"
                item-label="full_name"
                :item-searchs="['full_name']"
                label="Nuevo tutor (personal del plantel)"
                placeholder="Buscar al nuevo tutor por nombre…" />
            <label for="change-tutor-reason" class="block text-xs font-semibold text-slate-500 mb-1 mt-3">Motivo del cambio</label>
            <textarea id="change-tutor-reason" v-model="changeM.reason" rows="3" class="w-full rounded-lg border-slate-300 text-sm" placeholder="Describe por qué se cambia de tutor…"></textarea>
            <template #footer>
                <button @click="submitChangeTutor" :disabled="busy || !changeM.tutor || !changeM.reason.trim()" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Cambiar tutor</button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h, defineComponent } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

const T = API.TUTORING_API
const toast = useToast()

const Badge = defineComponent({
    props: { ok: Boolean, on: String, off: String },
    setup: (p) => () => h('span', { class: ['px-2 py-0.5 rounded-full text-[11px] font-bold', p.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'] }, p.ok ? p.on : p.off),
})
const Sig = defineComponent({
    props: { t: String, tone: { type: String, default: 'blue' } },
    setup: (p) => () => h('span', { class: ['px-2 py-0.5 rounded-full text-[11px] font-semibold', `bg-${p.tone}-100 text-${p.tone}-700`] }, p.t),
})
const PStatus = defineComponent({
    props: { status: String },
    setup: (p) => {
        const map: Record<string, [string, string]> = {
            open: ['bg-amber-100 text-amber-700', 'Propuesta'],
            confirmed: ['bg-blue-100 text-blue-700', 'Confirmada'],
            rejected: ['bg-rose-100 text-rose-700', 'Rechazada'],
            withdrawn: ['bg-slate-100 text-slate-500', 'Retirada'],
        }
        return () => h('span', { class: ['px-2 py-0.5 rounded-full text-[11px] font-bold', (map[p.status ?? ''] ?? map.open)[0]] }, (map[p.status ?? ''] ?? map.open)[1])
    },
})

// Texto del chip de señal: muestra el valor cuando aporta (p. ej. "Materias reprobadas 3").
const sigText = (s: any) => (s.value > 1 ? `${s.label} ${s.value}` : s.label)

const options = reactive<{ periods: any[]; careers: any[]; campuses: any[] }>({ periods: [], careers: [], campuses: [] })
const filters = reactive({ period_id: '', campus_id: '', career_id: '', semester: '', search: '', only_suggested: false })

// La oferta es POR CAMPUS: al elegir un campus, el dropdown de carreras se acota a
// las que se ofertan ahí (career.campus_ids). Sin campus = todas las del plantel.
const visibleCareers = computed(() => {
    if (!filters.campus_id) return options.careers
    const cid = Number(filters.campus_id)
    return options.careers.filter((c: any) => (c.campus_ids ?? []).includes(cid))
})
function onCampusChange() {
    // Si la carrera elegida ya no se oferta en el campus, límpiala.
    if (filters.career_id && !visibleCareers.value.some((c: any) => c.id === Number(filters.career_id))) {
        filters.career_id = ''
    }
}

const risk = ref<any[]>([])
const riskLoading = ref(false)
const proposals = ref<any[]>([])
const windowOpen = ref(false)
const windowInfo = ref('')
const busy = ref(false)
const searchOpen = ref(false)

// Paginación en CLIENTE del padrón (el endpoint de riesgo devuelve el arreglo completo).
const riskColumns: DataTableColumn[] = [
    { key: 'alumno', label: 'Alumno' },
    { key: 'semester', label: 'Sem.', field: 'semester', align: 'center', width: '70px' },
    { key: 'signals', label: 'Señales' },
    { key: 'suggested', label: 'Sugerido', align: 'center', width: '100px' },
    { key: 'acciones', label: '', align: 'right', width: '130px' },
]
const tablePage = ref(1)
const tablePerPage = ref(10)
const pagedRisk = computed(() => {
    const start = (tablePage.value - 1) * tablePerPage.value
    return risk.value.slice(start, start + tablePerPage.value)
})
const riskPagination = computed(() => ({ page: tablePage.value, perPage: tablePerPage.value, total: risk.value.length }))
function onRiskTableChange(e: any) { tablePage.value = e.page; tablePerPage.value = e.perPage }

const propose = reactive<{ open: boolean; row: any; reason: string }>({ open: false, row: null, reason: '' })
const confirmM = reactive<{ open: boolean; row: any; tutor: number | null }>({ open: false, row: null, tutor: null })
const changeM = reactive<{ open: boolean; row: any; tutor: number | null; reason: string }>({ open: false, row: null, tutor: null, reason: '' })

async function fetchOptions() {
    const { data } = await api.get(T.determination.catalog)
    options.periods = data.periods ?? []; options.careers = data.careers ?? []; options.campuses = data.campuses ?? []
    // Auto-selecciona el periodo activo (o el más reciente) que ya resuelve el backend.
    if (!filters.period_id && data.active_period_id) {
        filters.period_id = data.active_period_id
        await Promise.all([fetchWindow(), fetchProposals()])
    }
}
async function fetchWindow() {
    if (!filters.period_id) { windowOpen.value = false; windowInfo.value = ''; return }
    const { data } = await api.get(T.determination.window, { params: { period_id: filters.period_id } })
    windowOpen.value = !!data.is_open
    const w = data.window
    windowInfo.value = w ? [w.opens_at, w.closes_at].filter(Boolean).map((d: string) => new Date(d).toLocaleDateString()).join(' → ') : ''
}
function openSearch() {
    searchOpen.value = true
    if (!risk.value.length && filters.period_id) fetchRisk()
}
async function fetchRisk() {
    if (!filters.period_id) { toast.error('Elige un periodo.'); return }
    riskLoading.value = true
    try {
        const { data } = await api.get(T.determination.risk, { params: {
            period_id: filters.period_id, campus_id: filters.campus_id || undefined,
            career_id: filters.career_id || undefined,
            semester: filters.semester || undefined, search: filters.search || undefined,
            only_suggested: filters.only_suggested ? 1 : undefined,
        } })
        risk.value = data.data ?? []
        tablePage.value = 1
        await Promise.all([fetchWindow(), fetchProposals()])
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo buscar candidatos.')
    } finally {
        riskLoading.value = false
    }
}
async function fetchProposals() {
    const { data } = await api.get(T.determination.proposals, { params: { period_id: filters.period_id || undefined, career_id: filters.career_id || undefined } })
    proposals.value = data.data ?? []
}

function openPropose(r: any) { propose.row = r; propose.reason = ''; propose.open = true }
async function submitPropose() {
    await act(async () => {
        await api.post(T.determination.register, {
            period_id: Number(filters.period_id),
            student_id: propose.row.student_id,
            career_id: propose.row.career_id ?? filters.career_id ?? null,
            reason: propose.reason.trim(),
            source: propose.row.suggested ? 'system' : 'manual',
            signals: propose.row.risk ?? null,
        })
        propose.open = false
        toast.success('Propuesta registrada.')
        await fetchProposals()
    })
}

function openConfirm(p: any) { confirmM.row = p; confirmM.tutor = null; confirmM.open = true }
async function submitConfirm() {
    await act(async () => {
        await api.post(T.determination.confirm(confirmM.row.id), { tutor_user_id: Number(confirmM.tutor) })
        confirmM.open = false
        toast.success('Propuesta confirmada y tutor asignado.')
        await fetchProposals()
    })
}
function openChangeTutor(p: any) { changeM.row = p; changeM.tutor = null; changeM.reason = ''; changeM.open = true }
async function submitChangeTutor() {
    await act(async () => {
        await api.post(T.determination.changeTutor(changeM.row.id), {
            tutor_user_id: Number(changeM.tutor),
            reason: changeM.reason.trim() || undefined,
        })
        changeM.open = false
        toast.success('Tutor cambiado.')
        await fetchProposals()
    })
}
async function reject(p: any) { await api.post(T.determination.reject(p.id)); toast.success('Propuesta rechazada.'); await fetchProposals() }
async function withdraw(p: any) { await api.post(T.determination.withdraw(p.id)); toast.success('Propuesta retirada.'); await fetchProposals() }

async function act(fn: () => Promise<void>) {
    busy.value = true
    try { await fn() }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Operación no permitida.') }
    finally { busy.value = false }
}

onMounted(fetchOptions)
</script>
