<template>
    <div class="space-y-4 max-w-6xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Aprobar distribución de función académica</h1>
            <p class="text-sm text-slate-500">Revisa y aprueba (con folio) o rechaza la distribución de tus docentes.</p>
        </div>

        <!-- Filtros -->
        <div class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3">
            <div class="w-72">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Periodo</label>
                <FormRemoteSelect
                    v-model="periodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :params="{ order_by: 'actual_start_date', order_dir: 'desc', per_page: 100 }"
                    item-label="name" item-value="id"
                    placeholder="Selecciona un periodo…"
                    @update:model-value="loadInbox"
                />
            </div>
            <div class="w-48">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado</label>
                <select v-model="status" class="w-full border rounded-lg px-3 py-2 text-sm" @change="loadInbox">
                    <option value="submitted">En revisión</option>
                    <option value="approved">Aprobadas</option>
                    <option value="rejected">Rechazadas</option>
                    <option value="">Todas</option>
                </select>
            </div>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="!periodId" class="text-center py-8 text-slate-400">Selecciona un periodo para ver las solicitudes.</div>
        <div v-else-if="rows.length === 0" class="text-center py-8 text-slate-400">Sin solicitudes para este filtro.</div>

        <div v-else class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                        <th class="text-left px-4 py-2">Docente</th>
                        <th class="text-left px-4 py-2">Estado</th>
                        <th class="text-right px-4 py-2">Horas</th>
                        <th class="text-left px-4 py-2">Folio</th>
                        <th class="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="r in rows" :key="r.id" class="hover:bg-slate-50">
                        <td class="px-4 py-2 text-slate-800">{{ teacherName(r.teacherId) }}</td>
                        <td class="px-4 py-2"><span class="px-2 py-0.5 rounded text-xs font-semibold" :class="statusClass(r.status)">{{ statusLabel(r.status) }}</span></td>
                        <td class="px-4 py-2 text-right">{{ totalHours(r) }}</td>
                        <td class="px-4 py-2 text-slate-500">{{ r.folio ?? '—' }}</td>
                        <td class="px-4 py-2 text-right">
                            <button class="px-2.5 py-1 text-xs rounded-lg border border-slate-300 hover:bg-slate-100" @click="openDetail(r)">Ver</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Detalle -->
        <div v-if="detail" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="detail = null">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-auto p-5 space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-slate-800">{{ teacherName(detail.teacherId) }}</h3>
                    <span class="px-2 py-0.5 rounded text-xs font-semibold" :class="statusClass(detail.status)">{{ statusLabel(detail.status) }}</span>
                </div>

                <div class="border rounded-lg divide-y">
                    <div v-for="d in detail.details" :key="d.id" class="px-3 py-2 flex items-start justify-between gap-3 text-sm">
                        <div>
                            <p class="text-slate-800">{{ critName(d.rubricCriterionId) }}</p>
                            <p v-if="d.locked" class="text-[11px] text-slate-400">Asignado por jefatura</p>
                        </div>
                        <span class="shrink-0 font-semibold text-slate-700">{{ Number(d.hours).toFixed(Number(d.hours) % 1 === 0 ? 0 : 1) }} hrs</span>
                    </div>
                    <div class="px-3 py-2 flex justify-between text-sm font-bold bg-slate-50">
                        <span>Total</span><span>{{ totalHours(detail) }} hrs</span>
                    </div>
                </div>

                <div v-if="detail.status === 'rejected' && detail.rejectedReason" class="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
                    {{ detail.rejectedReason }}
                </div>

                <!-- Acciones (solo en revisión) -->
                <div v-if="detail.status === 'submitted'" class="space-y-3 border-t pt-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Folio del oficio</label>
                        <input v-model="folio" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Folio…" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Motivo de rechazo (si aplica)</label>
                        <textarea v-model="reason" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Motivo…"></textarea>
                    </div>
                    <div class="flex justify-end gap-2">
                        <button class="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            :disabled="busy || !reason.trim()" @click="reject">Rechazar</button>
                        <button class="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                            :disabled="busy || !folio.trim()" @click="approve">Aprobar</button>
                    </div>
                </div>
                <div class="flex justify-end">
                    <button class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50" @click="detail = null">Cerrar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import type { DistributionRequest } from '@/modules/midocencia/types/distribution.type'

const toast = useToast()
const A = API.MIDOCENCIA_API.approval

const periodId = ref<number | null>(null)
const status = ref('submitted')
const rows = ref<DistributionRequest[]>([])
const loading = ref(false)
const busy = ref(false)

const detail = ref<DistributionRequest | null>(null)
const folio = ref('')
const reason = ref('')

const teacherNames = ref<Record<number, string>>({})
const critNames = ref<Record<number, string>>({})

onMounted(loadTeachers)

async function loadTeachers() {
    try {
        const { data } = await api.get(API.SCA_API.teachers.list, { params: { per_page: 1000 } })
        const items = data?.items ?? data?.data ?? data ?? []
        const map: Record<number, string> = {}
        for (const t of items) map[t.id] = t.displayName ?? t.name ?? `Docente #${t.id}`
        teacherNames.value = map
    } catch { /* noop */ }
}

function teacherName(id: number) { return teacherNames.value[id] ?? `Docente #${id}` }
function critName(id: number) { return critNames.value[id] ?? `Criterio #${id}` }
function totalHours(r: DistributionRequest) {
    const t = r.details.reduce((a, d) => a + Number(d.hours), 0)
    return t.toFixed(t % 1 === 0 ? 0 : 1)
}
function statusLabel(s: string) { return ({ draft: 'Borrador', submitted: 'En revisión', approved: 'Aprobada', rejected: 'Rechazada' } as any)[s] ?? s }
function statusClass(s: string) {
    return ({ draft: 'bg-slate-100 text-slate-600', submitted: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' } as any)[s] ?? 'bg-slate-100'
}

async function loadInbox() {
    if (!periodId.value) { rows.value = []; return }
    loading.value = true
    try {
        const { data } = await api.get(A.inbox, { params: { period_id: periodId.value, status: status.value } })
        rows.value = Array.isArray(data) ? data : []
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo cargar la bandeja.')
        rows.value = []
    } finally { loading.value = false }
}

async function openDetail(r: DistributionRequest) {
    detail.value = r
    folio.value = r.folio ?? ''
    reason.value = ''
    // Nombres de criterios de la versión de la solicitud.
    if (r.rubricId) {
        try {
            const { data } = await api.get(API.MIDOCENCIA_API.rubrics.tree(r.rubricId))
            const map: Record<number, string> = {}
            for (const ru of data.rubros ?? []) for (const c of ru.criteria ?? []) map[c.id] = c.name
            critNames.value = map
        } catch { /* noop */ }
    }
}

async function approve() {
    if (!detail.value) return
    busy.value = true
    try {
        await api.post(A.approve(detail.value.id), { folio: folio.value })
        toast.success('Distribución aprobada.')
        detail.value = null
        await loadInbox()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo aprobar.') }
    finally { busy.value = false }
}

async function reject() {
    if (!detail.value) return
    busy.value = true
    try {
        await api.post(A.reject(detail.value.id), { reason: reason.value })
        toast.success('Distribución rechazada.')
        detail.value = null
        await loadInbox()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo rechazar.') }
    finally { busy.value = false }
}
</script>
