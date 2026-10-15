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

        <!-- Filtros -->
        <div class="rounded-xl border bg-white p-4 grid sm:grid-cols-5 gap-3">
            <select v-model="filters.period_id" class="rounded-lg border-slate-300 text-sm">
                <option value="">Periodo…</option>
                <option v-for="p in options.periods" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <select v-model="filters.career_id" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todas las carreras</option>
                <option v-for="c in options.careers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <input v-model="filters.semester" type="number" min="1" placeholder="Semestre" class="rounded-lg border-slate-300 text-sm" />
            <input v-model="filters.search" placeholder="Nombre / nº control" class="rounded-lg border-slate-300 text-sm" />
            <label class="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" v-model="filters.only_suggested" /> Solo sugeridos
            </label>
        </div>
        <div class="flex gap-2">
            <button @click="fetchRisk" class="px-4 py-2 rounded-lg border text-sm font-semibold text-slate-600">Buscar candidatos</button>
            <span class="text-xs text-slate-400 self-center" v-if="minRepeat">Umbral de recurse: {{ minRepeat }}</span>
        </div>

        <!-- Tabla de candidatos en riesgo -->
        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Alumno</th><th>Sem.</th><th>Señales</th><th>Sugerido</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="r in risk" :key="r.student_id" class="border-b last:border-0 hover:bg-slate-50">
                        <td class="px-4 py-2"><span class="font-semibold text-slate-700">{{ r.num_control }}</span> <span class="text-slate-500">{{ r.full_name }}</span></td>
                        <td class="text-slate-600">{{ r.semester }}</td>
                        <td class="space-x-1">
                            <Sig v-if="r.repeated" :t="'Recurse ' + r.repeated" />
                            <Sig v-if="r.drop_risk" :t="'Riesgo de baja'" tone="rose" />
                            <Sig v-if="r.cedula_flags" :t="'Cédula ' + r.cedula_flags" tone="violet" />
                            <Sig v-if="r.open_referrals" :t="'Canaliz. ' + r.open_referrals" tone="amber" />
                            <span v-if="!r.repeated && !r.drop_risk && !r.cedula_flags && !r.open_referrals" class="text-slate-300">—</span>
                        </td>
                        <td><Badge :ok="r.suggested" on="Sí" off="No" /></td>
                        <td class="pr-3 text-right">
                            <button @click="openPropose(r)" :disabled="!windowOpen"
                                class="px-3 py-1 rounded-lg border text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">Proponer</button>
                        </td>
                    </tr>
                    <tr v-if="!risk.length"><td colspan="5" class="px-4 py-6 text-center text-slate-400">Sin candidatos (elige periodo y busca).</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Propuestas registradas -->
        <div class="flex items-center justify-between pt-2">
            <h2 class="text-sm font-bold uppercase text-slate-500">Propuestas registradas</h2>
            <button @click="fetchProposals" class="text-xs text-slate-400 hover:text-slate-600">Actualizar</button>
        </div>
        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Alumno</th><th>Motivo</th><th>Origen</th><th>Estado</th><th>Tutor</th><th></th>
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
                            <span v-else class="text-[11px] text-slate-400">—</span>
                        </td>
                    </tr>
                    <tr v-if="!proposals.length"><td colspan="6" class="px-4 py-6 text-center text-slate-400">Sin propuestas.</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Modal proponer -->
        <Modal v-if="propose.open" @close="propose.open = false" :title="'Proponer: ' + propose.row?.full_name">
            <label class="block text-xs font-semibold text-slate-500 mb-1">Motivo</label>
            <textarea v-model="propose.reason" rows="3" class="w-full rounded-lg border-slate-300 text-sm" placeholder="Describe la razón de la tutoría individual…"></textarea>
            <p class="text-[11px] text-slate-400 mt-1">Origen: <b>{{ propose.row?.suggested ? 'sugerido por riesgo' : 'manual (academia)' }}</b></p>
            <template #footer>
                <button @click="submitPropose" :disabled="busy || !propose.reason.trim()" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Registrar propuesta</button>
            </template>
        </Modal>

        <!-- Modal confirmar (asignar tutor) -->
        <Modal v-if="confirmM.open" @close="confirmM.open = false" :title="'Confirmar: ' + confirmM.row?.full_name">
            <label class="block text-xs font-semibold text-slate-500 mb-1">ID de usuario del tutor</label>
            <input v-model="confirmM.tutor" type="number" min="1" class="w-full rounded-lg border-slate-300 text-sm" placeholder="tutor_user_id" />
            <p class="text-[11px] text-slate-400 mt-1">Se creará/usará la asignación individual del tutor y se agregará al alumno.</p>
            <template #footer>
                <button @click="submitConfirm" :disabled="busy || !confirmM.tutor" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Confirmar y asignar</button>
            </template>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h, defineComponent } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

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
const Modal = defineComponent({
    props: { title: String },
    emits: ['close'],
    setup: (p, { emit, slots }) => () => h('div', { class: 'fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4', onClick: (e: any) => { if (e.target === e.currentTarget) emit('close') } }, [
        h('div', { class: 'bg-white rounded-xl p-5 w-full max-w-lg space-y-3' }, [
            h('div', { class: 'flex items-center justify-between' }, [
                h('h3', { class: 'text-sm font-bold text-slate-700 uppercase' }, p.title),
                h('button', { class: 'text-slate-400 hover:text-slate-600', onClick: () => emit('close') }, '✕'),
            ]),
            slots.default?.(),
            slots.footer ? h('div', { class: 'flex justify-end pt-2' }, slots.footer()) : null,
        ]),
    ]),
})

const options = reactive<{ periods: any[]; careers: any[] }>({ periods: [], careers: [] })
const filters = reactive({ period_id: '', career_id: '', semester: '', search: '', only_suggested: false })
const risk = ref<any[]>([])
const proposals = ref<any[]>([])
const minRepeat = ref<number | null>(null)
const windowOpen = ref(false)
const windowInfo = ref('')
const busy = ref(false)

const propose = reactive<{ open: boolean; row: any; reason: string }>({ open: false, row: null, reason: '' })
const confirmM = reactive<{ open: boolean; row: any; tutor: string }>({ open: false, row: null, tutor: '' })

async function fetchOptions() {
    const { data } = await api.get(T.determination.catalog)
    options.periods = data.periods ?? []; options.careers = data.careers ?? []
}
async function fetchWindow() {
    if (!filters.period_id) { windowOpen.value = false; windowInfo.value = ''; return }
    const { data } = await api.get(T.determination.window, { params: { period_id: filters.period_id } })
    windowOpen.value = !!data.is_open
    const w = data.window
    windowInfo.value = w ? [w.opens_at, w.closes_at].filter(Boolean).map((d: string) => new Date(d).toLocaleDateString()).join(' → ') : ''
}
async function fetchRisk() {
    if (!filters.period_id) { toast.error('Elige un periodo.'); return }
    const { data } = await api.get(T.determination.risk, { params: {
        period_id: filters.period_id, career_id: filters.career_id || undefined,
        semester: filters.semester || undefined, search: filters.search || undefined,
        only_suggested: filters.only_suggested ? 1 : undefined,
    } })
    risk.value = data.data ?? []
    minRepeat.value = data.min_repeat ?? null
    await Promise.all([fetchWindow(), fetchProposals()])
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

function openConfirm(p: any) { confirmM.row = p; confirmM.tutor = ''; confirmM.open = true }
async function submitConfirm() {
    await act(async () => {
        await api.post(T.determination.confirm(confirmM.row.id), { tutor_user_id: Number(confirmM.tutor) })
        confirmM.open = false
        toast.success('Propuesta confirmada y tutor asignado.')
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
