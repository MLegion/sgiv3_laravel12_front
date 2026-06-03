<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Residentes</h1>

            <div class="flex items-center gap-3 flex-wrap">
                <select v-model="statusFilter" class="border rounded-md px-2 py-1 text-xs" @change="reload">
                    <option value="">Todos los estados</option>
                    <option value="registered">REGISTRADO</option>
                    <option value="in_progress">EN PROCESO</option>
                    <option value="concluded">CONCLUIDO</option>
                    <option value="dropped">BAJA</option>
                </select>
                <select v-model="approvalFilter" class="border rounded-md px-2 py-1 text-xs" @change="reload">
                    <option value="">Aval: todos</option>
                    <option value="pending">PENDIENTE</option>
                    <option value="approved">APROBADO</option>
                    <option value="rejected">RECHAZADO</option>
                </select>

                <!-- Auto-accept (solo coordinador; se oculta si la API responde 403) -->
                <label v-if="autoAcceptVisible" class="flex items-center gap-2 text-xs text-slate-600 border rounded-md px-2 py-1">
                    <input type="checkbox" v-model="autoAccept" @change="toggleAutoAccept" />
                    Auto-aprobar documentos
                </label>
            </div>
        </div>

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
                <button type="button"
                    class="border w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-blue-50 text-blue-600"
                    title="Ver detalle"
                    @click="router.push({ name: 'residencies.detail', params: { id: row.id } })">
                    <EyeIcon class="w-4 h-4" />
                </button>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { EyeIcon } from '@heroicons/vue/24/outline'
import type { Residency, ResidencyStatus, ApprovalStatus } from '@/modules/residencies/types/residency.type'

const R = API.RESIDENCIES_API
const router = useRouter()

const rows    = ref<Residency[]>([])
const loading = ref(false)
const pagination = ref({ page: 1, perPage: 20, total: 0 })

const statusFilter   = ref('')
const approvalFilter = ref('')

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
    return ({ registered: 'REGISTRADO', in_progress: 'EN PROCESO', concluded: 'CONCLUIDO', dropped: 'BAJA' } as Record<string, string>)[s] ?? s.toUpperCase()
}
function statusClass(s: ResidencyStatus): string {
    return ({
        registered:  'bg-blue-100 text-blue-700',
        in_progress: 'bg-indigo-100 text-indigo-700',
        concluded:   'bg-emerald-100 text-emerald-700',
        dropped:     'bg-slate-200 text-slate-500',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-600'
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

fetchData()
loadAutoAccept()
</script>
