<template>
    <div class="space-y-4 max-w-5xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Ciencias Básicas — aprobar horario</h1>
            <p class="text-sm text-slate-500">Revisa y aprueba el horario (fase B) de tus docentes de básicas.</p>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3">
            <div class="w-72">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Periodo</label>
                <FormRemoteSelect
                    v-model="periodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :params="{ order_by: 'actual_start_date', order_dir: 'desc', per_page: 100 }"
                    item-label="name" item-value="id" placeholder="Selecciona un periodo…" @update:model-value="load" />
            </div>
            <div class="w-48">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Horario</label>
                <select v-model="status" class="w-full border rounded-lg px-3 py-2 text-sm" @change="load">
                    <option value="submitted">En revisión</option>
                    <option value="approved">Aprobados</option>
                    <option value="">Todos</option>
                </select>
            </div>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="!periodId" class="text-center py-8 text-slate-400">Selecciona un periodo.</div>
        <div v-else-if="rows.length === 0" class="text-center py-8 text-slate-400">Sin horarios para este filtro.</div>

        <div v-else class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr><th class="text-left px-4 py-2">Docente</th><th class="px-4 py-2">Horario</th><th class="px-4 py-2"></th></tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="r in rows" :key="r.id" class="hover:bg-slate-50">
                        <td class="px-4 py-2 text-slate-800">{{ teacherName(r.teacherId) }}</td>
                        <td class="px-4 py-2 text-center"><span class="px-2 py-0.5 rounded text-xs font-semibold" :class="sc(r.scheduleStatus)">{{ sl(r.scheduleStatus) }}</span></td>
                        <td class="px-4 py-2 text-right"><button class="px-2.5 py-1 text-xs rounded-lg border border-slate-300 hover:bg-slate-100" @click="open(r)">Ver</button></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Detalle -->
        <div v-if="detail" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="detail = null">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-auto p-5 space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-slate-800">{{ teacherName(detail.teacherId) }}</h3>
                    <span class="px-2 py-0.5 rounded text-xs font-semibold" :class="sc(detail.scheduleStatus)">{{ sl(detail.scheduleStatus) }}</span>
                </div>
                <div v-if="blocks.length" class="border rounded-lg divide-y">
                    <div v-for="b in blocks" :key="b.id" class="px-3 py-1.5 text-sm flex justify-between">
                        <span>{{ dia(b.dayOfWeek) }} {{ b.startTime }}–{{ b.endTime }}</span>
                        <span class="text-slate-500">aula #{{ b.placeId }}</span>
                    </div>
                </div>
                <p v-else class="text-xs text-slate-400">Sin bloques.</p>

                <div v-if="detail.scheduleStatus === 'submitted'" class="space-y-2 border-t pt-3">
                    <textarea v-model="reason" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Motivo de rechazo (si aplica)…"></textarea>
                    <div class="flex justify-end gap-2">
                        <button class="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" :disabled="busy || !reason.trim()" @click="reject">Rechazar</button>
                        <button class="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50" :disabled="busy" @click="approve">Aprobar horario</button>
                    </div>
                </div>
                <div class="flex justify-end gap-2">
                    <button class="px-3 py-1.5 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50" :disabled="oficioBusy" @click="oficio">{{ oficioBusy ? 'Generando…' : 'Descargar oficio' }}</button>
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
import { useReportGenerator } from '@/modules/reports/composables/useReportGenerator'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import type { DistributionRequest } from '@/modules/midocencia/types/distribution.type'

const toast = useToast()
const { downloadFromContext } = useReportGenerator()
const B = API.MIDOCENCIA_API.basicas

const periodId = ref<number | null>(null)
const status = ref('submitted')
const rows = ref<DistributionRequest[]>([])
const loading = ref(false)
const busy = ref(false)
const oficioBusy = ref(false)
const detail = ref<DistributionRequest | null>(null)
const blocks = ref<Array<{ id: number; dayOfWeek: number | null; startTime: string; endTime: string; placeId: number | null }>>([])
const reason = ref('')
const teacherNames = ref<Record<number, string>>({})

const dias: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' }
function dia(d: number | null) { return d ? (dias[d] ?? '?') : '—' }
function teacherName(id: number) { return teacherNames.value[id] ?? `Docente #${id}` }
function sl(s: string) { return ({ pending: 'Por colocar', submitted: 'En revisión', approved: 'Aprobado' } as any)[s] ?? s }
function sc(s: string) { return ({ pending: 'bg-slate-100 text-slate-600', submitted: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700' } as any)[s] ?? 'bg-slate-100' }

onMounted(async () => {
    try {
        const { data } = await api.get(API.SCA_API.teachers.list, { params: { per_page: 1000 } })
        const items = data?.items ?? data?.data ?? data ?? []
        const map: Record<number, string> = {}
        for (const t of items) map[t.id] = t.displayName ?? t.name ?? `Docente #${t.id}`
        teacherNames.value = map
    } catch { /* noop */ }
})

async function load() {
    if (!periodId.value) { rows.value = []; return }
    loading.value = true
    try { const { data } = await api.get(B.inbox, { params: { period_id: periodId.value, status: status.value } }); rows.value = Array.isArray(data) ? data : [] }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar la bandeja.'); rows.value = [] }
    finally { loading.value = false }
}

async function open(r: DistributionRequest) {
    detail.value = r; reason.value = ''; blocks.value = []
    try { const { data } = await api.get(B.scheduleBlocks(r.id)); blocks.value = Array.isArray(data) ? data : [] } catch { /* noop */ }
}

async function approve() {
    if (!detail.value) return
    busy.value = true
    try { await api.post(B.scheduleApprove(detail.value.id), {}); toast.success('Horario aprobado y colocado como ocupación oficial.'); detail.value = null; await load() }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo aprobar.') }
    finally { busy.value = false }
}

async function reject() {
    if (!detail.value) return
    busy.value = true
    try { await api.post(B.scheduleReject(detail.value.id), { reason: reason.value }); toast.success('Horario rechazado.'); detail.value = null; await load() }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo rechazar.') }
    finally { busy.value = false }
}

async function oficio() {
    if (!detail.value) return
    oficioBusy.value = true
    try { const { data } = await api.get(B.oficio(detail.value.id)); await downloadFromContext({ reportCode: data.reportCode, context: data.context, filename: 'OFICIO_FUNCION_ACADEMICA' }) }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo generar el oficio.') }
    finally { oficioBusy.value = false }
}
</script>
