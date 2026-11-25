<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Cierre / Constancias</h1>
            <p class="text-xs text-slate-400">Confirma el cumplimiento y firma las constancias (Cap. 15).</p>
        </div>

        <!-- Filtros -->
        <div class="rounded-xl border bg-white p-4 grid sm:grid-cols-3 gap-3">
            <select v-model="filters.period_id" aria-label="Filtrar por periodo" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todos los periodos</option>
                <option v-for="p in options.periods" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <select v-model="filters.career_id" aria-label="Filtrar por carrera" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todas las carreras</option>
                <option v-for="c in options.careers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <button @click="fetchList" class="px-4 py-2 rounded-lg border text-sm font-semibold text-slate-600">Filtrar</button>
        </div>

        <!-- Tabla de asignaciones -->
        <DataTable :columns="columns" :rows="rows" hide-search caption="Asignaciones para cierre" empty-text="Sin asignaciones en el periodo.">
            <template #cell-tutor_name="{ row }"><span class="font-semibold text-slate-700">{{ row.tutor_name }}</span></template>
            <template #cell-period_name="{ row }"><span class="text-slate-600">{{ row.period_name ?? '—' }}</span></template>
            <template #cell-has_pat="{ row }"><span :class="row.has_pat ? 'text-emerald-600' : 'text-rose-500'">{{ row.has_pat ? 'Sí' : 'No' }}</span></template>
            <template #cell-session_count="{ row }"><span class="text-slate-600">{{ row.session_count }}</span></template>
            <template #cell-followups="{ row }"><span class="text-slate-600">{{ row.followups_done }}/{{ row.followups_required }}</span></template>
            <template #cell-tutor_suggested="{ row }"><Badge :ok="row.tutor_suggested" :on="'Cumple'" :off="'Insuf.'" /></template>
            <template #cell-completion_status="{ row }"><StatusBadge :status="row.completion_status" /></template>
            <template #cell-tutees="{ row }"><span class="text-slate-600">{{ row.tutees_confirmed }}/{{ row.tutees_total }}</span></template>
            <template #cell-actions="{ row }">
                <button @click="openDrawer(row)" class="px-3 py-1 rounded-lg border text-xs font-semibold text-slate-600 hover:bg-slate-100">Revisar</button>
            </template>
        </DataTable>

        <!-- Drawer de detalle -->
        <BaseDrawer v-model="drawer.open" :title="drawer.row?.tutor_name" :subtitle="drawer.row?.period_name" size="xl">
            <div class="space-y-6">

                <!-- Cumplimiento del tutor -->
                <section class="rounded-xl border p-4 space-y-3">
                    <h3 class="text-xs font-bold uppercase text-slate-500">Constancia del tutor</h3>
                    <div class="flex flex-wrap items-center gap-4 gap-y-2 text-sm">
                        <span>PAT: <b :class="detail.has_pat ? 'text-emerald-600' : 'text-rose-500'">{{ detail.has_pat ? 'entregado' : 'faltante' }}</b></span>
                        <span>Sesiones: <b>{{ detail.session_count }}</b></span>
                        <span>Hitos: <b :class="detail.followups_done >= detail.followups_required && detail.followups_required > 0 ? 'text-emerald-600' : 'text-slate-600'">{{ detail.followups_done }}/{{ detail.followups_required }}</b></span>
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
                        <button @click="openConstancia('reporte_final', drawer.row.id, 'Reporte final de tutoría')"
                            class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">Firmar reporte final</button>
                    </div>
                </section>

                <!-- Tutorados -->
                <section class="rounded-xl border overflow-hidden">
                    <h3 class="text-xs font-bold uppercase text-slate-500 px-4 pt-3">Constancias de tutorados</h3>
                    <DataTable :columns="tuteeColumns" :rows="detail.tutees" hide-search caption="Constancias de tutorados" empty-text="Sin tutorados." class="mt-2">
                        <template #cell-student="{ row }"><span class="font-semibold text-slate-700">{{ row.num_control }}</span> <span class="text-slate-500">{{ row.student_name }}</span></template>
                        <template #cell-attended_count="{ row }"><span class="text-slate-600">{{ row.attended_count }}</span></template>
                        <template #cell-tutee_suggested="{ row }"><Badge :ok="row.tutee_suggested" :on="'Cumple'" :off="'Insuf.'" /></template>
                        <template #cell-completion_status="{ row }"><StatusBadge :status="row.completion_status" /></template>
                        <template #cell-actions="{ row }">
                            <button v-if="row.completion_status !== 'confirmed'" @click="confirmTutee(row)" :disabled="busy"
                                class="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold disabled:opacity-50">Confirmar</button>
                            <template v-else>
                                <button @click="revertTutee(row)" :disabled="busy" class="px-2 py-1 rounded border text-[11px] text-slate-600">Revertir</button>
                                <button @click="openConstancia('alumno', row.id, 'Constancia de ' + row.num_control)" class="px-2 py-1 rounded bg-blue-600 text-white text-[11px] font-semibold ml-1">Firmar</button>
                            </template>
                        </template>
                    </DataTable>
                </section>
            </div>
        </BaseDrawer>

        <!-- Panel de firmantes de una constancia -->
        <BaseModal v-model="constancia.open" :title="constancia.label" size="lg">
            <div class="space-y-4">
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
        </BaseModal>

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
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import BaseDrawer from '@/app/components/ui/modal/BaseDrawer.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const columns: DataTableColumn<any>[] = [
    { key: 'tutor_name', label: 'Tutor' },
    { key: 'period_name', label: 'Periodo' },
    { key: 'has_pat', label: 'PAT' },
    { key: 'session_count', label: 'Sesiones' },
    { key: 'followups', label: 'Hitos' },
    { key: 'tutor_suggested', label: 'Sugerido' },
    { key: 'completion_status', label: 'Cumplimiento' },
    { key: 'tutees', label: 'Tutorados' },
    { key: 'actions', label: '', align: 'right' },
]
const tuteeColumns: DataTableColumn<any>[] = [
    { key: 'student', label: 'Alumno' },
    { key: 'attended_count', label: 'Asist.' },
    { key: 'tutee_suggested', label: 'Sugerido' },
    { key: 'completion_status', label: 'Cumpl.' },
    { key: 'actions', label: '', align: 'right' },
]

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
const detail = reactive<{ tutor_suggested: boolean; has_pat: boolean; session_count: number; followups_done: number; followups_required: number; tutees: any[] }>({
    tutor_suggested: false, has_pat: false, session_count: 0, followups_done: 0, followups_required: 0, tutees: [],
})

const constancia = reactive<{ open: boolean; kind: 'tutor' | 'alumno' | 'reporte_final'; id: number; label: string; reportId: number | null; fullySigned: boolean; signers: any[] }>({
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
    Object.assign(detail, { tutor_suggested: data.tutor_suggested, has_pat: data.has_pat, session_count: data.session_count, followups_done: data.followups_done ?? 0, followups_required: data.followups_required ?? 0, tutees: data.tutees ?? [] })
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

async function openConstancia(kind: 'tutor' | 'alumno' | 'reporte_final', id: number, label: string) {
    Object.assign(constancia, { open: true, kind, id, label, reportId: null, fullySigned: false, signers: [] })
    await loadConstanciaStatus()
}
async function loadConstanciaStatus() {
    const url = constancia.kind === 'tutor' ? T.closure.tutorConstanciaStatus(constancia.id)
        : constancia.kind === 'reporte_final' ? T.closure.finalReportStatus(constancia.id)
        : T.closure.tuteeConstanciaStatus(constancia.id)
    const { data } = await api.get(url)
    const d = data.data ?? data
    Object.assign(constancia, { reportId: d.report_id ?? null, fullySigned: !!d.fully_signed, signers: d.signers ?? [] })
}

function startSign(s: any) {
    sign.endpoint = constancia.kind === 'tutor'
        ? T.closure.tutorConstanciaSign(constancia.id, s.slot)
        : constancia.kind === 'reporte_final'
        ? T.closure.finalReportSign(constancia.id, s.slot)
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
