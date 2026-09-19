<template>
    <div class="space-y-5">
        <button @click="$router.back()" class="text-sm text-slate-500 hover:text-slate-700">← Volver</button>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>

        <template v-else-if="record">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-xl font-semibold text-slate-800">{{ record.student?.name ?? '—' }}</h1>
                    <p class="text-xs font-mono text-slate-400">{{ record.student?.num_control }} · {{ record.period?.name ?? '—' }}</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold" :class="statusClass(record.status)">{{ STATUS_LABELS[record.status] }}</span>
            </div>

            <p v-if="msg" class="text-sm px-4 py-2.5 rounded-lg" :class="msgError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ msg }}</p>

            <!-- Acciones -->
            <div class="flex flex-wrap gap-2">
                <button v-if="record.status === 'pending_activation' && canManage" @click="activate" class="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold">Activar</button>
                <button v-if="canRelease" @click="release" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Liberar (acreditar)</button>
                <button v-if="canManage && record.status !== 'concluded'" @click="drop" class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-semibold">Dar de baja</button>
                <button v-if="canManage && !record.process_exception_until" @click="grantException" class="px-3 py-1.5 rounded-lg border text-xs font-semibold text-slate-600">Otorgar excepción</button>
                <button v-if="canManage && record.process_exception_until" @click="revokeException" class="px-3 py-1.5 rounded-lg border text-xs font-semibold text-slate-600">Revocar excepción</button>
            </div>

            <!-- Progreso -->
            <div class="rounded-xl border bg-white p-5">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Avance de horas</p>
                <p class="text-sm font-bold text-blue-600">{{ record.accumulated_hours }} / {{ record.required_hours }} h ({{ record.progress_percent }}%)</p>
                <div class="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div class="h-full bg-blue-500" :style="{ width: `${record.progress_percent}%` }"></div>
                </div>
            </div>

            <!-- Datos del proceso -->
            <div class="rounded-xl border bg-white p-5 space-y-4">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Datos del servicio</h2>
                <div class="grid sm:grid-cols-2 gap-4">
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Dependencia receptora</span>
                        <select v-model="form.company_id" :disabled="!canManage" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                            <option :value="null">— Selecciona —</option>
                            <option v-for="d in dependencies" :key="d.id" :value="d.id">{{ d.name }}</option>
                        </select>
                    </label>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Asesor interno (usuario)</span>
                        <input v-model.number="form.internal_advisor_id" :disabled="!canManage" type="number" class="mt-1 w-full rounded-lg border-slate-300 text-sm" placeholder="ID de usuario" />
                    </label>
                    <label class="block sm:col-span-2">
                        <span class="text-xs font-semibold text-slate-500">Título del programa</span>
                        <input v-model="form.program_title" :disabled="!canManage" type="text" class="mt-1 w-full rounded-lg border-slate-300 text-sm" maxlength="255" />
                    </label>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Inicio</span>
                        <input v-model="form.started_at" :disabled="!canManage" type="date" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                    </label>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Término estimado</span>
                        <input v-model="form.expected_end_at" :disabled="!canManage" type="date" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                    </label>
                </div>
                <div v-if="canManage" class="flex justify-end">
                    <button @click="saveProcess" :disabled="saving" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Guardar</button>
                </div>
            </div>

            <!-- Reportes -->
            <div class="rounded-xl border bg-white p-5 space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Reportes de avance</h2>
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left text-[10px] uppercase text-slate-400 border-b">
                            <th class="py-2">#</th><th>Periodo</th><th>Horas</th><th>Estado</th><th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="r in reports" :key="r.id" class="border-b last:border-0">
                            <td class="py-2 font-semibold">{{ r.report_number }}</td>
                            <td class="text-slate-500">{{ r.period_start ?? '—' }} → {{ r.period_end ?? '—' }}</td>
                            <td>{{ r.hours }} h</td>
                            <td><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="reportClass(r.status)">{{ reportLabel(r.status) }}</span></td>
                            <td class="text-right">
                                <template v-if="canReview && r.status !== 'approved'">
                                    <button @click="review(r.id, 'approved')" class="text-xs text-emerald-600 font-semibold mr-2">Aprobar</button>
                                    <button @click="review(r.id, 'rejected')" class="text-xs text-red-600 font-semibold">Rechazar</button>
                                </template>
                            </td>
                        </tr>
                        <tr v-if="!reports.length"><td colspan="5" class="py-3 text-center text-slate-400">Sin reportes.</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Documentos -->
            <div class="rounded-xl border bg-white p-5 space-y-2">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Documentos</h2>
                <div v-for="d in documents" :key="d.code" class="flex items-center justify-between border-b last:border-0 py-2">
                    <div>
                        <p class="text-sm font-semibold text-slate-700">{{ d.name }}
                            <span v-if="d.kind === 'generated'" class="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">generado</span>
                        </p>
                        <p v-if="d.document" class="text-xs">
                            <span class="px-2 py-0.5 rounded-full font-bold" :class="reportClass(d.document.status)">{{ reportLabel(d.document.status) }}</span>
                        </p>
                        <p v-else class="text-xs text-slate-400">Sin subir</p>
                    </div>
                    <div class="flex items-center gap-2" v-if="d.document">
                        <button @click="viewDoc(d.document.id)" class="text-xs text-blue-600 font-semibold">Ver</button>
                        <template v-if="d.document.status !== 'approved'">
                            <button @click="reviewDoc(d.document.id, 'approved')" class="text-xs text-emerald-600 font-semibold">Aprobar</button>
                            <button @click="reviewDoc(d.document.id, 'rejected')" class="text-xs text-red-600 font-semibold">Rechazar</button>
                        </template>
                    </div>
                </div>
                <p v-if="!documents.length" class="text-sm text-slate-400">Sin documentos configurados.</p>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { STATUS_LABELS, type SocialServiceRecord, type SocialServiceReport, type DependencyOption, type DocumentChecklistItem } from '@/modules/social-service/types/social-service.type'

const props = defineProps<{ id: string | number }>()
const S = API.SOCIAL_SERVICE_API

const loading = ref(true)
const saving = ref(false)
const record = ref<SocialServiceRecord | null>(null)
const reports = ref<SocialServiceReport[]>([])
const documents = ref<DocumentChecklistItem[]>([])
const dependencies = ref<DependencyOption[]>([])
const msg = ref('')
const msgError = ref(false)

const form = reactive({ company_id: null as number | null, internal_advisor_id: null as number | null, program_title: '', started_at: '', expected_end_at: '' })

// El acceso a esta página lo gobierna el menú (permiso backend) y cada acción la
// valida el backend (RequiresPermission). Aquí sólo se acota por el ESTADO del
// expediente; el coordinador/asesor ven las acciones que su permiso permita ejecutar.
const canManage = true
const canReview = true
const canRelease = computed(() =>
    record.value?.status === 'in_progress'
    && (record.value?.accumulated_hours ?? 0) >= (record.value?.required_hours ?? 0)
    && !record.value?.kardex_synced_at)

function statusClass(s: string) {
    return { pending_activation: 'bg-amber-100 text-amber-700', registered: 'bg-sky-100 text-sky-700', in_progress: 'bg-blue-100 text-blue-700', concluded: 'bg-emerald-100 text-emerald-700', dropped: 'bg-slate-200 text-slate-500' }[s] ?? 'bg-slate-100'
}
function reportClass(s: string) { return { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' }[s] ?? 'bg-slate-100' }
function reportLabel(s: string) { return { pending: 'Por revisar', approved: 'Aprobado', rejected: 'Rechazado' }[s] ?? s }
function flash(text: string, error = false) { msg.value = text; msgError.value = error; setTimeout(() => (msg.value = ''), 4000) }

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(S.records.byId(props.id))
        record.value = data
        Object.assign(form, {
            company_id: data.company_id,
            internal_advisor_id: data.internal_advisor_id,
            program_title: data.program_title ?? '',
            started_at: data.started_at ?? '',
            expected_end_at: data.expected_end_at ?? '',
        })
        const [rep, dep, docs] = await Promise.all([
            api.get(S.records.reports(props.id)),
            api.get(S.dependencies),
            api.get(S.records.documents(props.id)),
        ])
        reports.value = rep.data ?? []
        dependencies.value = dep.data ?? []
        documents.value = docs.data ?? []
    } finally {
        loading.value = false
    }
}

async function saveProcess() {
    saving.value = true
    try {
        await api.put(S.records.process(props.id), {
            company_id: form.company_id,
            internal_advisor_id: form.internal_advisor_id,
            program_title: form.program_title || null,
            started_at: form.started_at || null,
            expected_end_at: form.expected_end_at || null,
        })
        await load(); flash('Datos guardados.')
    } catch (e: any) { flash(e?.response?.data?.message ?? 'No se pudo guardar.', true) } finally { saving.value = false }
}

async function activate() { await act(() => api.post(S.records.activate(props.id), {}), 'Servicio social activado.') }
async function release() { await act(() => api.post(S.records.release(props.id), {}), 'Servicio social liberado y acreditado.') }
async function drop() {
    if (!confirm('¿Dar de baja este servicio social?')) return
    await act(() => api.delete(S.records.drop(props.id)), 'Dado de baja.')
}
async function grantException() {
    const until = prompt('Excepción vigente hasta (AAAA-MM-DD):')
    if (!until) return
    await act(() => api.post(S.records.grantException(props.id), { info_until: until, grade_until: until }), 'Excepción otorgada.')
}
async function revokeException() { await act(() => api.delete(S.records.revokeException(props.id)), 'Excepción revocada.') }

async function review(reportId: number, status: 'approved' | 'rejected') {
    let reason: string | null = null
    if (status === 'rejected') { reason = prompt('Motivo del rechazo:') ; if (reason === null) return }
    await act(() => api.post(S.reports.review(reportId), { status, reason }), status === 'approved' ? 'Reporte aprobado.' : 'Reporte rechazado.')
}

async function viewDoc(id: number) {
    const { data } = await api.get(S.documents.download(id), { responseType: 'blob' })
    window.open(URL.createObjectURL(data), '_blank')
}

async function reviewDoc(id: number, status: 'approved' | 'rejected') {
    let reason: string | null = null
    if (status === 'rejected') { reason = prompt('Motivo del rechazo:'); if (reason === null) return }
    await act(() => status === 'approved' ? api.post(S.documents.approve(id), { reason }) : api.post(S.documents.reject(id), { reason }), status === 'approved' ? 'Documento aprobado.' : 'Documento rechazado.')
}

async function act(fn: () => Promise<any>, ok: string) {
    saving.value = true
    try { await fn(); await load(); flash(ok) }
    catch (e: any) { flash(e?.response?.data?.message ?? 'La operación falló.', true) }
    finally { saving.value = false }
}

onMounted(load)
</script>
