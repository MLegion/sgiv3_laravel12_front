<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Empresas</h1>
            <div class="flex items-center gap-2">
                <input v-model="search" placeholder="Buscar…" class="border rounded-md px-2 py-1 text-xs" @keyup.enter="reload" />
                <select v-model="statusFilter" class="border rounded-md px-2 py-1 text-xs" @change="reload">
                    <option value="pending">PENDIENTES</option>
                    <option value="approved">APROBADAS</option>
                    <option value="rejected">RECHAZADAS</option>
                    <option value="">TODAS</option>
                </select>
            </div>
        </div>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>
        <div v-else-if="!companies.length" class="text-sm text-slate-400 italic">Sin empresas.</div>

        <ul v-else class="space-y-3">
            <li v-for="c in companies" :key="c.id" class="rounded-xl border bg-white p-4 space-y-3">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="text-sm font-bold text-slate-700">{{ c.name }}</p>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="approvalClass(c.approval_status)">{{ approvalLabel(c.approval_status) }}</span>
                        </div>
                        <p class="text-xs text-slate-500">
                            <span v-if="c.rfc">RFC {{ c.rfc }} · </span>
                            <span v-if="c.sector">{{ c.sector.name }} · </span>
                            <span v-if="c.titular_name">Titular: {{ c.titular_name }}</span>
                        </p>
                        <p v-if="c.address" class="text-xs text-slate-400">{{ c.address }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button v-if="c.approval_status !== 'approved'" type="button"
                            class="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700" @click="approve(c.id)">Aprobar</button>
                        <button v-if="c.approval_status !== 'rejected'" type="button"
                            class="text-xs px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700" @click="openReason('company', c.id)">Rechazar</button>
                        <button type="button" class="text-xs px-3 py-1.5 border rounded-md hover:bg-slate-50" @click="toggleAdvisors(c)">
                            {{ expanded === c.id ? 'Ocultar asesores' : 'Asesores' }}
                        </button>
                    </div>
                </div>

                <!-- Asesores -->
                <div v-if="expanded === c.id" class="border-t pt-3 space-y-2">
                    <p v-if="!advisors.length" class="text-xs text-slate-400 italic">Sin asesores propuestos.</p>
                    <div v-for="a in advisors" :key="a.id" class="flex items-center justify-between text-sm">
                        <div>
                            <span class="font-medium text-slate-700">{{ a.name }}</span>
                            <span v-if="a.position" class="text-xs text-slate-400"> · {{ a.position }}</span>
                            <span class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold" :class="approvalClass(a.approval_status)">{{ approvalLabel(a.approval_status) }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button v-if="a.approval_status !== 'approved'" type="button"
                                class="text-xs px-2 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700" @click="approveAdvisor(c.id, a.id)">Aprobar</button>
                            <button v-if="a.approval_status !== 'rejected'" type="button"
                                class="text-xs px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700" @click="openReason('advisor', a.id, c.id)">Rechazar</button>
                        </div>
                    </div>
                </div>
            </li>
        </ul>

        <!-- Modal motivo -->
        <Teleport to="body">
            <div v-if="reason.open" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/40" @click="reason.open = false" />
                <div class="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 z-10">
                    <h3 class="text-sm font-semibold text-slate-800">Motivo del rechazo</h3>
                    <textarea v-model="reason.text" rows="3" class="border rounded-md w-full px-3 py-2 text-sm" placeholder="Explica por qué se rechaza…"></textarea>
                    <p v-if="reason.error" class="text-xs text-red-600">{{ reason.error }}</p>
                    <div class="flex justify-end gap-2">
                        <button type="button" class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="reason.open = false">Cancelar</button>
                        <button type="button" class="px-4 py-2 text-sm rounded-lg text-white bg-red-600 hover:bg-red-700" @click="submitReason">Rechazar</button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { Company, CompanyAdvisor, ApprovalStatus } from '@/modules/residencies/types/residency.type'

const R = API.RESIDENCIES_API

const loading = ref(false)
const companies = ref<Company[]>([])
const statusFilter = ref('pending')
const search = ref('')

const expanded = ref<number | null>(null)
const advisors = ref<CompanyAdvisor[]>([])

const reason = reactive<{ open: boolean; text: string; error: string | null; mode: 'company' | 'advisor'; id: number | null; companyId: number | null }>({
    open: false, text: '', error: null, mode: 'company', id: null, companyId: null,
})

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(R.companies.list, {
            params: { status: statusFilter.value || undefined, search: search.value || undefined, per_page: 100 },
        })
        companies.value = data.items ?? []
    } finally { loading.value = false }
}
function reload() { fetchData() }

async function toggleAdvisors(c: Company) {
    if (expanded.value === c.id) { expanded.value = null; return }
    expanded.value = c.id
    const { data } = await api.get(R.companies.advisors(c.id))
    advisors.value = data ?? []
}

async function approve(id: number) { await api.post(R.companies.approve(id), {}); await fetchData() }
async function approveAdvisor(companyId: number, id: number) {
    await api.post(R.companies.approveAdvisor(companyId, id), {})
    const { data } = await api.get(R.companies.advisors(companyId))
    advisors.value = data ?? []
}

function openReason(mode: 'company' | 'advisor', id: number, companyId: number | null = null) {
    reason.open = true; reason.text = ''; reason.error = null; reason.mode = mode; reason.id = id; reason.companyId = companyId
}
async function submitReason() {
    if (!reason.text.trim()) { reason.error = 'El motivo es obligatorio.'; return }
    try {
        if (reason.mode === 'company' && reason.id) {
            await api.post(R.companies.reject(reason.id), { notes: reason.text })
            reason.open = false; await fetchData()
        } else if (reason.mode === 'advisor' && reason.id && reason.companyId) {
            await api.post(R.companies.rejectAdvisor(reason.companyId, reason.id), { notes: reason.text })
            reason.open = false
            const { data } = await api.get(R.companies.advisors(reason.companyId))
            advisors.value = data ?? []
        }
    } catch (e: any) {
        reason.error = e?.response?.data?.message ?? 'No se pudo rechazar.'
    }
}

function approvalLabel(s: ApprovalStatus): string {
    return ({ pending: 'PENDIENTE', approved: 'APROBADA', rejected: 'RECHAZADA' } as Record<string, string>)[s] ?? s.toUpperCase()
}
function approvalClass(s: ApprovalStatus): string {
    return ({
        pending:  'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-500'
}

fetchData()
</script>
