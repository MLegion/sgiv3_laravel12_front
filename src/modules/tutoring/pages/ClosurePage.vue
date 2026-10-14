<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Cierre / Constancias</h1>
            <p class="text-xs text-slate-400">Confirma el cumplimiento y firma las constancias (Cap. 15).</p>
        </div>

        <!-- Filtros -->
        <div class="rounded-xl border bg-white p-4 grid sm:grid-cols-3 gap-3">
            <select v-model="filters.period_id" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todos los periodos</option>
                <option v-for="p in options.periods" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <select v-model="filters.career_id" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todas las carreras</option>
                <option v-for="c in options.careers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <button @click="fetchList" class="px-4 py-2 rounded-lg border text-sm font-semibold text-slate-600">Filtrar</button>
        </div>

        <!-- Tabla de asignaciones -->
        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Tutor</th><th>Periodo</th><th>PAT</th><th>Sesiones</th>
                    <th>Sugerido</th><th>Cumplimiento</th><th>Tutorados</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="r in rows" :key="r.id" class="border-b last:border-0 hover:bg-slate-50">
                        <td class="px-4 py-2 font-semibold text-slate-700">{{ r.tutor_name }}</td>
                        <td class="text-slate-600">{{ r.period_name ?? '—' }}</td>
                        <td><span :class="r.has_pat ? 'text-emerald-600' : 'text-rose-500'">{{ r.has_pat ? 'Sí' : 'No' }}</span></td>
                        <td class="text-slate-600">{{ r.session_count }}</td>
                        <td><Badge :ok="r.tutor_suggested" :on="'Cumple'" :off="'Insuf.'" /></td>
                        <td><StatusBadge :status="r.completion_status" /></td>
                        <td class="text-slate-600">{{ r.tutees_confirmed }}/{{ r.tutees_total }}</td>
                        <td class="pr-3 text-right">
                            <button @click="openDrawer(r)" class="px-3 py-1 rounded-lg border text-xs font-semibold text-slate-600 hover:bg-slate-100">Revisar</button>
                        </td>
                    </tr>
                    <tr v-if="!rows.length"><td colspan="8" class="px-4 py-6 text-center text-slate-400">Sin asignaciones en el periodo.</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Drawer de detalle -->
        <div v-if="drawer.open" class="fixed inset-0 bg-black/40 flex justify-end z-40" @click.self="drawer.open = false">
            <div class="bg-white w-full max-w-2xl h-full overflow-y-auto p-6 space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-base font-bold text-slate-800">{{ drawer.row?.tutor_name }}</h2>
                        <p class="text-xs text-slate-400">{{ drawer.row?.period_name }}</p>
                    </div>
                    <button @click="drawer.open = false" class="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <!-- Cumplimiento del tutor -->
                <section class="rounded-xl border p-4 space-y-3">
                    <h3 class="text-xs font-bold uppercase text-slate-500">Constancia del tutor</h3>
                    <div class="flex items-center gap-4 text-sm">
                        <span>PAT: <b :class="detail.has_pat ? 'text-emerald-600' : 'text-rose-500'">{{ detail.has_pat ? 'entregado' : 'faltante' }}</b></span>
                        <span>Sesiones: <b>{{ detail.session_count }}</b></span>
                        <Badge :ok="detail.tutor_suggested" :on="'Sugerido: cumple'" :off="'Sugerido: insuficiente'" />
                        <StatusBadge :status="drawer.row?.completion_status" />
                    </div>
                    <div class="flex gap-2">
                        <button v-if="drawer.row?.completion_status !== 'confirmed'" @click="confirmTutor" :disabled="busy"
                            class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">Confirmar cumplimiento</button>
                        <button v-else @click="revertTutor" :disabled="busy"
                            class="px-3 py-1.5 rounded-lg border text-xs font-semibold text-slate-600 disabled:opacity-50">Revertir</button>
                        <button v-if="drawer.row?.completion_status === 'confirmed'" @click="openConstancia('tutor', drawer.row.id, 'Constancia del tutor')"
                            class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold">Firmar constancia</button>
                    </div>
                </section>

                <!-- Tutorados -->
                <section class="rounded-xl border overflow-hidden">
                    <h3 class="text-xs font-bold uppercase text-slate-500 px-4 pt-3">Constancias de tutorados</h3>
                    <table class="w-full text-sm mt-2">
                        <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-y">
                            <th class="px-4 py-2">Alumno</th><th>Asist.</th><th>Sugerido</th><th>Cumpl.</th><th></th>
                        </tr></thead>
                        <tbody>
                            <tr v-for="t in detail.tutees" :key="t.id" class="border-b last:border-0">
                                <td class="px-4 py-2"><span class="font-semibold text-slate-700">{{ t.num_control }}</span> <span class="text-slate-500">{{ t.student_name }}</span></td>
                                <td class="text-slate-600">{{ t.attended_count }}</td>
                                <td><Badge :ok="t.tutee_suggested" :on="'Cumple'" :off="'Insuf.'" /></td>
                                <td><StatusBadge :status="t.completion_status" /></td>
                                <td class="pr-3 text-right whitespace-nowrap">
                                    <button v-if="t.completion_status !== 'confirmed'" @click="confirmTutee(t)" :disabled="busy"
                                        class="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold disabled:opacity-50">Confirmar</button>
                                    <template v-else>
                                        <button @click="revertTutee(t)" :disabled="busy" class="px-2 py-1 rounded border text-[11px] text-slate-600">Revertir</button>
                                        <button @click="openConstancia('alumno', t.id, 'Constancia de ' + t.num_control)" class="px-2 py-1 rounded bg-blue-600 text-white text-[11px] font-semibold ml-1">Firmar</button>
                                    </template>
                                </td>
                            </tr>
                            <tr v-if="!detail.tutees.length"><td colspan="5" class="px-4 py-6 text-center text-slate-400">Sin tutorados.</td></tr>
                        </tbody>
                    </table>
                </section>
            </div>
        </div>

        <!-- Panel de firmantes de una constancia -->
        <div v-if="constancia.open" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="constancia.open = false">
            <div class="bg-white rounded-xl p-5 w-full max-w-lg space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">{{ constancia.label }}</h3>
                    <button @click="constancia.open = false" class="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <p v-if="!constancia.reportId" class="text-sm text-amber-600">No hay un reporte/plantilla configurado para esta constancia en el plantel.</p>
                <div v-else class="space-y-2">
                    <div v-for="s in constancia.signers" :key="s.slot" class="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div>
                            <p class="text-sm font-semibold text-slate-700">{{ s.avala || s.slot }}</p>
                            <p class="text-[11px] text-slate-400">{{ s.role_code }}</p>
                        </div>
                        <div class="text-right">
                            <span v-if="s.signed" class="text-xs font-bold text-emerald-600">Firmado · {{ s.signed.folio }}</span>
                            <button v-else-if="s.can_sign" @click="startSign(s)" class="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold">Firmar</button>
                            <span v-else class="text-xs text-slate-400">Pendiente</span>
                        </div>
                    </div>
                    <p class="text-xs" :class="constancia.fullySigned ? 'text-emerald-600' : 'text-slate-400'">
                        {{ constancia.fullySigned ? 'Constancia completamente firmada.' : 'Faltan firmas requeridas.' }}
                    </p>
                </div>
            </div>
        </div>

        <SignDocumentModal
            v-model="sign.open"
            :endpoint="sign.endpoint"
            :label="sign.label"
            :signerRole="sign.signerRole"
            @signed="onSigned"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h, defineComponent } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import SignDocumentModal from '@/modules/signatures/modals/SignDocumentModal.vue'

const T = API.TUTORING_API
const toast = useToast()

// Badges inline (sin archivos extra).
const Badge = defineComponent({
    props: { ok: Boolean, on: String, off: String },
    setup: (p) => () => h('span', {
        class: ['px-2 py-0.5 rounded-full text-[11px] font-bold', p.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'],
    }, p.ok ? p.on : p.off),
})
const StatusBadge = defineComponent({
    props: { status: String },
    setup: (p) => () => h('span', {
        class: ['px-2 py-0.5 rounded-full text-[11px] font-bold', p.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'],
    }, p.status === 'confirmed' ? 'Confirmado' : 'Pendiente'),
})

const rows = ref<any[]>([])
const options = reactive<{ periods: any[]; careers: any[] }>({ periods: [], careers: [] })
const filters = reactive({ period_id: '', career_id: '' })
const busy = ref(false)

const drawer = reactive<{ open: boolean; row: any }>({ open: false, row: null })
const detail = reactive<{ tutor_suggested: boolean; has_pat: boolean; session_count: number; tutees: any[] }>({
    tutor_suggested: false, has_pat: false, session_count: 0, tutees: [],
})

const constancia = reactive<{ open: boolean; kind: 'tutor' | 'alumno'; id: number; label: string; reportId: number | null; fullySigned: boolean; signers: any[] }>({
    open: false, kind: 'tutor', id: 0, label: '', reportId: null, fullySigned: false, signers: [],
})

const sign = reactive<{ open: boolean; endpoint: string; label: string; signerRole: string }>({ open: false, endpoint: '', label: '', signerRole: '' })

async function fetchList() {
    const { data } = await api.get(T.closure.list, { params: { period_id: filters.period_id || undefined, career_id: filters.career_id || undefined } })
    rows.value = data.data ?? []
}
async function fetchOptions() {
    const { data } = await api.get(T.assignments.filterOptions)
    options.periods = data.periods ?? []; options.careers = data.careers ?? []
}

async function openDrawer(row: any) {
    drawer.row = row; drawer.open = true
    await loadDetail(row.id)
}
async function loadDetail(assignmentId: number) {
    const { data } = await api.get(T.closure.assignment(assignmentId))
    Object.assign(detail, { tutor_suggested: data.tutor_suggested, has_pat: data.has_pat, session_count: data.session_count, tutees: data.tutees ?? [] })
}

async function confirmTutor() {
    await act(async () => {
        await api.post(T.closure.confirmTutor(drawer.row.id))
        drawer.row.completion_status = 'confirmed'
        toast.success('Cumplimiento del tutor confirmado.')
        await fetchList()
    })
}
async function revertTutor() {
    await act(async () => {
        await api.post(T.closure.revertTutor(drawer.row.id))
        drawer.row.completion_status = 'pending'
        toast.success('Cumplimiento revertido.')
        await fetchList()
    })
}
async function confirmTutee(t: any) {
    await act(async () => {
        await api.post(T.closure.confirmTutee(t.id))
        t.completion_status = 'confirmed'
        toast.success('Cumplimiento del tutorado confirmado.')
    })
}
async function revertTutee(t: any) {
    await act(async () => {
        await api.post(T.closure.revertTutee(t.id))
        t.completion_status = 'pending'
        toast.success('Cumplimiento revertido.')
    })
}

async function openConstancia(kind: 'tutor' | 'alumno', id: number, label: string) {
    Object.assign(constancia, { open: true, kind, id, label, reportId: null, fullySigned: false, signers: [] })
    await loadConstanciaStatus()
}
async function loadConstanciaStatus() {
    const url = constancia.kind === 'tutor' ? T.closure.tutorConstanciaStatus(constancia.id) : T.closure.tuteeConstanciaStatus(constancia.id)
    const { data } = await api.get(url)
    const d = data.data ?? data
    Object.assign(constancia, { reportId: d.report_id ?? null, fullySigned: !!d.fully_signed, signers: d.signers ?? [] })
}

function startSign(s: any) {
    sign.endpoint = constancia.kind === 'tutor'
        ? T.closure.tutorConstanciaSign(constancia.id, s.slot)
        : T.closure.tuteeConstanciaSign(constancia.id, s.slot)
    sign.label = (s.avala || s.slot)
    sign.signerRole = s.avala || s.slot
    sign.open = true
}
async function onSigned() {
    await loadConstanciaStatus()
    await fetchList()
    if (drawer.row) await loadDetail(drawer.row.id)
}

async function act(fn: () => Promise<void>) {
    busy.value = true
    try { await fn() }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Operación no permitida.') }
    finally { busy.value = false }
}

onMounted(async () => { await Promise.all([fetchOptions(), fetchList()]) })
</script>
