<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Residentes</h1>

            <div class="flex items-center gap-3 flex-wrap">
                <select v-model="statusFilter" class="border rounded-md px-2 py-1 text-xs" @change="reload">
                    <option value="">Todos los estados</option>
                    <option value="pending_activation">PENDIENTE DE ACTIVACIÓN</option>
                    <option value="registered">REGISTRADO</option>
                    <option value="in_progress">EN PROCESO</option>
                    <option value="concluded">CONCLUIDO</option>
                    <option value="dropped">BAJA</option>
                </select>

                <!-- Solo el coordinador (res.residency.manage) ve estas acciones.
                     Reutiliza el probe de auto-accept, gateado por el mismo permiso. -->
                <template v-if="autoAcceptVisible">
                    <button type="button" class="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        :disabled="bulkBusy" @click="askBulk('activate')">Activar pendientes</button>
                    <button type="button" class="text-xs px-3 py-1.5 rounded-md border hover:bg-slate-50 disabled:opacity-50"
                        :disabled="bulkBusy" @click="askBulk('resend')">Reenviar instructivo</button>
                </template>
                <select v-model="approvalFilter" class="border rounded-md px-2 py-1 text-xs" @change="reload">
                    <option value="">Aval: todos</option>
                    <option value="pending">PENDIENTE</option>
                    <option value="approved">APROBADO</option>
                    <option value="rejected">RECHAZADO</option>
                </select>

                <!-- Filtros por contexto: selector si hay varias opciones, valor fijo si una sola -->
                <select v-if="campusOptions.length > 1" v-model="campusFilter" class="border rounded-md px-2 py-1 text-xs" @change="reload">
                    <option :value="null">Campus: todos</option>
                    <option v-for="c in campusOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <span v-else-if="campusOptions.length === 1" class="text-xs text-slate-600 border rounded-md px-2 py-1 bg-slate-50">Campus: {{ campusOptions[0].name }}</span>

                <select v-if="modalityOptions.length > 1" v-model="modalityFilter" class="border rounded-md px-2 py-1 text-xs" @change="reload">
                    <option :value="null">Modalidad: todas</option>
                    <option v-for="m in modalityOptions" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
                <span v-else-if="modalityOptions.length === 1" class="text-xs text-slate-600 border rounded-md px-2 py-1 bg-slate-50">Modalidad: {{ modalityOptions[0].name }}</span>

                <select v-if="careerOptions.length > 1" v-model="careerFilter" class="border rounded-md px-2 py-1 text-xs" @change="reload">
                    <option :value="null">Carrera: todas</option>
                    <option v-for="c in careerOptions" :key="c.id" :value="c.id">{{ c.short_name ?? c.name }}</option>
                </select>
                <span v-else-if="careerOptions.length === 1" class="text-xs text-slate-600 border rounded-md px-2 py-1 bg-slate-50">Carrera: {{ careerOptions[0].short_name ?? careerOptions[0].name }}</span>

                <!-- Auto-accept (solo coordinador; se oculta si la API responde 403) -->
                <label v-if="autoAcceptVisible" class="flex items-center gap-2 text-xs text-slate-600 border rounded-md px-2 py-1">
                    <input type="checkbox" v-model="autoAccept" @change="toggleAutoAccept" />
                    Auto-aprobar documentos
                </label>
            </div>
        </div>

        <p v-if="resultMsg" class="text-sm px-3 py-2 rounded-lg" :class="resultErr ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ resultMsg }}</p>

        <DataTable :columns="columns" :rows="rows" :loading="loading" :pagination="pagination" @change="onChange">
            <template #cell-student="{ row }">
                <div class="flex flex-col">
                    <span class="text-sm font-bold text-slate-700">{{ row.studentName ?? '—' }}</span>
                    <span class="text-[10px] font-mono text-slate-400">{{ row.numControl ?? '' }}</span>
                </div>
            </template>
            <template #cell-career="{ row }">
                <span class="text-xs text-slate-600">{{ row.career ?? '—' }}</span>
            </template>
            <template #cell-company="{ row }">
                <span class="text-xs text-slate-600">{{ row.company ?? '—' }}</span>
            </template>
            <template #cell-status="{ row }">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
            </template>
            <template #cell-approval="{ row }">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="approvalClass(row.projectApprovalStatus)">
                    {{ approvalLabel(row.projectApprovalStatus) }}
                </span>
            </template>
            <template #cell-opciones="{ row }">
                <div class="flex items-center gap-1.5">
                    <button v-if="autoAcceptVisible && row.status === 'pending_activation'" type="button"
                        class="text-[10px] font-bold px-2 h-8 inline-flex items-center rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        :disabled="bulkBusy" title="Activar residencia"
                        @click="activateOne(row.id)">Activar</button>
                    <button v-else-if="autoAcceptVisible && (row.status === 'registered' || row.status === 'in_progress')" type="button"
                        class="border w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                        :disabled="bulkBusy" title="Reenviar instructivo"
                        @click="resendOne(row.id)">
                        <EnvelopeIcon class="w-4 h-4" />
                    </button>
                    <button type="button"
                        class="border w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-blue-50 text-blue-600"
                        title="Ver detalle"
                        @click="router.push({ name: 'residencies.detail', params: { id: row.id } })">
                        <EyeIcon class="w-4 h-4" />
                    </button>
                </div>
            </template>
        </DataTable>

        <ConfirmModal
            v-model="confirmOpen"
            variant="info"
            :title="confirmAction === 'activate' ? 'Activar residencias pendientes' : 'Reenviar instructivo'"
            :message="confirmAction === 'activate'
                ? 'Se activarán TODAS las residencias pendientes de activación y se enviará el instructivo a cada residente. ¿Continuar?'
                : 'Se reenviará el instructivo a TODOS los residentes activos en proceso. ¿Continuar?'"
            :confirm-text="confirmAction === 'activate' ? 'Activar' : 'Reenviar'"
            @confirm="runBulk"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { EyeIcon, EnvelopeIcon } from '@heroicons/vue/24/outline'
import type { Residency, ResidencyStatus, ApprovalStatus } from '@/modules/residencies/types/residency.type'

const R = API.RESIDENCIES_API
const router = useRouter()

const rows    = ref<Residency[]>([])
const loading = ref(false)
const pagination = ref({ page: 1, perPage: 20, total: 0 })

const statusFilter   = ref('')
const approvalFilter = ref('')

// Filtros por contexto (acotados a la carrera del jefe). Una sola opción → fijo.
const careerFilter   = ref<number | null>(null)
const campusFilter   = ref<number | null>(null)
const modalityFilter = ref<number | null>(null)
const careerOptions   = ref<{ id: number; name: string; short_name?: string | null }[]>([])
const campusOptions   = ref<{ id: number; name: string }[]>([])
const modalityOptions = ref<{ id: number; name: string }[]>([])

const autoAccept        = ref(false)
const autoAcceptVisible = ref(false)

const columns: DataTableColumn<Residency>[] = [
    { key: 'student',  label: 'RESIDENTE' },
    { key: 'career',   label: 'CARRERA' },
    { key: 'company',  label: 'EMPRESA' },
    { key: 'status',   label: 'ESTADO' },
    { key: 'approval', label: 'AVAL PROYECTO' },
    { key: 'opciones', label: 'OPCIONES' },
]

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(R.residency.list, {
            params: {
                page: pagination.value.page,
                per_page: pagination.value.perPage,
                status: statusFilter.value || undefined,
                project_approval: approvalFilter.value || undefined,
                career_id: careerFilter.value ?? undefined,
                campus_id: campusFilter.value ?? undefined,
                modality_type_id: modalityFilter.value ?? undefined,
            },
        })
        rows.value = data.items ?? []
        pagination.value.total = data.total ?? 0
    } finally { loading.value = false }
}

function reload() { pagination.value.page = 1; fetchData() }
function onChange(p: { page: number; perPage: number }) {
    pagination.value.page = p.page
    pagination.value.perPage = p.perPage
    fetchData()
}

async function loadAutoAccept() {
    try {
        const { data } = await api.get(R.documents.autoAccept)
        autoAccept.value = !!data.autoAccept
        autoAcceptVisible.value = true
    } catch { autoAcceptVisible.value = false }
}
async function toggleAutoAccept() {
    try {
        await api.put(R.documents.autoAccept, { auto_accept: autoAccept.value })
    } catch { autoAccept.value = !autoAccept.value }
}

function statusLabel(s: ResidencyStatus): string {
    return ({ pending_activation: 'PENDIENTE DE ACTIVACIÓN', registered: 'REGISTRADO', in_progress: 'EN PROCESO', concluded: 'CONCLUIDO', dropped: 'BAJA' } as Record<string, string>)[s] ?? s.toUpperCase()
}
function statusClass(s: ResidencyStatus): string {
    return ({
        pending_activation: 'bg-amber-100 text-amber-700',
        registered:  'bg-blue-100 text-blue-700',
        in_progress: 'bg-indigo-100 text-indigo-700',
        concluded:   'bg-emerald-100 text-emerald-700',
        dropped:     'bg-slate-200 text-slate-500',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-600'
}

const bulkBusy    = ref(false)
const confirmOpen = ref(false)
const confirmAction = ref<'activate' | 'resend' | null>(null)
const resultMsg   = ref('')
const resultErr   = ref(false)

async function activateOne(id: number) {
    bulkBusy.value = true
    try { await api.post(R.residency.activate(id), {}); await fetchData() } finally { bulkBusy.value = false }
}

async function resendOne(id: number) {
    bulkBusy.value = true
    resultMsg.value = ''
    try {
        await api.post(R.residency.resendInstructions(id), {})
        resultMsg.value = 'Instructivo reenviado al residente.'
        resultErr.value = false
    } catch (e: any) {
        resultMsg.value = e?.response?.data?.message ?? 'No se pudo reenviar.'
        resultErr.value = true
    } finally {
        bulkBusy.value = false
    }
}

function askBulk(action: 'activate' | 'resend') {
    confirmAction.value = action
    confirmOpen.value = true
}

async function runBulk() {
    const action = confirmAction.value
    confirmOpen.value = false
    if (! action) return
    bulkBusy.value = true
    resultMsg.value = ''
    try {
        if (action === 'activate') {
            const { data } = await api.post(R.residency.activateBulk, {})
            await fetchData()
            resultMsg.value = `Activadas ${data.activated ?? 0} de ${data.total_pending ?? 0} residencias pendientes.`
        } else {
            const { data } = await api.post(R.residency.resendInstructionsBulk, {})
            resultMsg.value = `Instructivo enviado a ${data.sent ?? 0} de ${data.total ?? 0} residentes.`
        }
        resultErr.value = false
    } catch (e: any) {
        resultMsg.value = e?.response?.data?.message ?? 'No se pudo completar la acción.'
        resultErr.value = true
    } finally {
        bulkBusy.value = false
    }
}
function approvalLabel(s: ApprovalStatus | null): string {
    return ({ pending: 'PENDIENTE', approved: 'APROBADO', rejected: 'RECHAZADO' } as Record<string, string>)[s ?? ''] ?? 'SIN PROPONER'
}
function approvalClass(s: ApprovalStatus | null): string {
    return ({
        pending:  'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
    } as Record<string, string>)[s ?? ''] ?? 'bg-slate-100 text-slate-500'
}

async function loadFilterOptions() {
    try {
        const { data } = await api.get(R.residency.filterOptions)
        careerOptions.value   = data.careers ?? []
        campusOptions.value   = data.campuses ?? []
        modalityOptions.value = data.modality_types ?? []
        // Si solo hay una opción se aplica directo (se muestra como valor fijo).
        if (careerOptions.value.length === 1)   careerFilter.value   = careerOptions.value[0].id
        if (campusOptions.value.length === 1)   campusFilter.value   = campusOptions.value[0].id
        if (modalityOptions.value.length === 1) modalityFilter.value = modalityOptions.value[0].id
        if (careerFilter.value || campusFilter.value || modalityFilter.value) fetchData()
    } catch { /* sin permiso o sin datos: filtros vacíos */ }
}

fetchData()
loadAutoAccept()
loadFilterOptions()
</script>
