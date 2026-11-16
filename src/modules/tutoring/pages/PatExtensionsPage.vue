<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Plazos de PAT</h1>
            <p class="text-xs text-slate-400">Otorga un plazo al tutor que no entregó su PAT a tiempo, o atiende sus solicitudes.</p>
        </div>

        <div class="rounded-xl border bg-white p-4 flex items-center gap-3">
            <select v-model="periodId" @change="load" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todos los periodos</option>
                <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <label class="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" v-model="onlyPending" /> Solo pendientes de entregar
            </label>
        </div>

        <div class="rounded-xl border bg-white overflow-x-auto">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Tutor</th><th>Grupo</th><th>Carrera</th><th>PAT</th><th>Extensión</th><th class="text-right pr-4">Acciones</th>
                </tr></thead>
                <tbody>
                    <tr v-for="r in visibleRows" :key="r.assignment_id" class="border-b last:border-0 align-top">
                        <td class="px-4 py-2 font-semibold text-slate-700">{{ r.tutor_name }}</td>
                        <td class="text-slate-600">{{ r.group_name ?? '—' }}</td>
                        <td class="text-slate-500 max-w-xs truncate" :title="r.career_name">{{ r.career_name ?? '—' }}</td>
                        <td><Badge :ok="r.pat_submitted" on="Entregado" off="Pendiente" /></td>
                        <td>
                            <div v-if="r.ext_status === 'requested'" class="text-amber-700">
                                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100">Solicitada</span>
                                <p v-if="r.tutor_reason" class="text-[11px] text-slate-500 mt-0.5 max-w-xs" :title="r.tutor_reason">“{{ r.tutor_reason }}”</p>
                            </div>
                            <div v-else-if="r.ext_status === 'granted'" class="text-emerald-700">
                                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100">Plazo hasta {{ fmtDate(r.extended_until) }}</span>
                            </div>
                            <span v-else-if="r.ext_status === 'rejected'" class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">Rechazada</span>
                            <span v-else class="text-slate-300">—</span>
                        </td>
                        <td class="text-right pr-4 whitespace-nowrap">
                            <button @click="openGrant(r)" class="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold">Otorgar plazo</button>
                            <button v-if="r.ext_status === 'requested'" @click="act(() => reject(r))" class="px-2 py-1 rounded border text-[11px] text-slate-600 ml-1">Rechazar</button>
                        </td>
                    </tr>
                    <tr v-if="!visibleRows.length"><td colspan="6" class="px-4 py-6 text-center text-slate-400">Sin asignaciones grupales.</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Modal otorgar plazo -->
        <BaseModal v-model="grant.open" :title="'Otorgar plazo de PAT: ' + (grant.row?.group_name ?? '')" size="md">
            <p class="text-[11px] text-slate-500 mb-2">El tutor podrá capturar/editar su PAT hasta la fecha indicada.</p>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Nueva fecha límite</label>
            <input v-model="grant.until" type="date" class="w-full rounded-lg border-slate-300 text-sm" />
            <label class="block text-xs font-semibold text-slate-500 mb-1 mt-3">Nota (opcional)</label>
            <textarea v-model="grant.note" rows="2" class="w-full rounded-lg border-slate-300 text-sm"></textarea>
            <template #footer>
                <button @click="submitGrant" :disabled="busy || !grant.until" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Otorgar</button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h, defineComponent } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'

const T = API.TUTORING_API
const toast = useToast()

const Badge = defineComponent({
    props: { ok: Boolean, on: String, off: String },
    setup: (p) => () => h('span', { class: ['px-2 py-0.5 rounded-full text-[11px] font-bold', p.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'] }, p.ok ? p.on : p.off),
})

const periods = ref<any[]>([])
const periodId = ref<string | number>('')
const onlyPending = ref(false)
const rows = ref<any[]>([])
const busy = ref(false)
const grant = reactive<{ open: boolean; row: any; until: string; note: string }>({ open: false, row: null, until: '', note: '' })

const visibleRows = computed(() => onlyPending.value ? rows.value.filter(r => !r.pat_submitted) : rows.value)
function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString() : '—' }

async function loadPeriods() {
    const { data } = await api.get(T.determination.catalog)
    periods.value = data.periods ?? []
    if (!periodId.value && data.active_period_id) periodId.value = data.active_period_id
}
async function load() {
    const { data } = await api.get(T.determination.patExtensions, { params: { period_id: periodId.value || undefined } })
    rows.value = data.data ?? []
}
function openGrant(r: any) { grant.row = r; grant.until = r.extended_until ?? ''; grant.note = ''; grant.open = true }
async function submitGrant() {
    await act(async () => {
        await api.post(T.assignments.patExtensionGrant(grant.row.assignment_id), { extended_until: grant.until, note: grant.note || undefined })
        grant.open = false; toast.success('Plazo otorgado.'); await load()
    })
}
async function reject(r: any) { await api.post(T.assignments.patExtensionReject(r.assignment_id), {}); toast.success('Solicitud rechazada.'); await load() }

async function act(fn: () => Promise<void>) {
    busy.value = true
    try { await fn() } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Operación no permitida.') } finally { busy.value = false }
}

onMounted(async () => { await loadPeriods(); await load() })
</script>
