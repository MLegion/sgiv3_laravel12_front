<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Personal por validar</h1>
            <p class="text-xs text-slate-400">Personal externo propuesto por los residentes, pendiente de aprobación.</p>
        </div>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>
        <div v-else-if="!rows.length" class="text-sm text-slate-400 italic">No hay personal pendiente.</div>

        <ul v-else class="space-y-2">
            <li v-for="p in rows" :key="p.id" class="rounded-xl border bg-white p-4 flex items-center justify-between gap-3 flex-wrap">
                <div class="min-w-0">
                    <p class="text-sm font-bold text-slate-700">{{ p.fullName }}</p>
                    <p class="text-xs text-slate-500">{{ p.companyName ?? '—' }}<span v-if="p.email"> · {{ p.email }}</span><span v-if="p.phone"> · {{ p.phone }}</span></p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button type="button" class="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700" @click="approve(p)">Aprobar</button>
                    <button type="button" class="text-xs px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700" @click="openReason(p)">Rechazar</button>
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
import { useToast } from '@/app/composables/useToast'
import type { PendingPersonnel } from '@/modules/residencies/types/residency.type'

const R = API.RESIDENCIES_API

const loading = ref(false)
const rows = ref<PendingPersonnel[]>([])

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(R.personnel.pending)
        rows.value = data ?? []
    } finally { loading.value = false }
}

async function approve(p: PendingPersonnel) {
    try {
        await api.post(R.companies.approveEmployee(p.companyId, p.id), {})
        useToast().success('Personal aprobado.')
        await load()
    } catch (e: any) {
        useToast().error(e?.response?.data?.message ?? 'No se pudo aprobar.')
    }
}

const reason = reactive<{ open: boolean; text: string; error: string | null; id: number | null; companyId: number | null }>({
    open: false, text: '', error: null, id: null, companyId: null,
})
function openReason(p: PendingPersonnel) {
    reason.open = true; reason.text = ''; reason.error = null; reason.id = p.id; reason.companyId = p.companyId
}
async function submitReason() {
    if (!reason.text.trim()) { reason.error = 'El motivo es obligatorio.'; return }
    if (!reason.id || !reason.companyId) return
    try {
        await api.post(R.companies.rejectEmployee(reason.companyId, reason.id), { notes: reason.text })
        reason.open = false
        useToast().success('Personal rechazado.')
        await load()
    } catch (e: any) {
        reason.error = e?.response?.data?.message ?? 'No se pudo rechazar.'
    }
}

load()
</script>
