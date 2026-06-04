<template>
    <div class="space-y-4 max-w-5xl">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Excepciones de Requisitos</h1>
                <p class="text-xs text-slate-500 mt-1">
                    Solicitudes de tus alumnos para saltarse un requisito de reinscripción. Al aprobar, el
                    requisito se da por cubierto y el alumno puede continuar.
                </p>
            </div>
            <select v-model="statusFilter" class="border rounded-md px-3 py-1.5 text-sm" @change="load">
                <option value="pending">PENDIENTES</option>
                <option value="approved">APROBADAS</option>
                <option value="rejected">RECHAZADAS</option>
                <option value="">TODAS</option>
            </select>
        </div>

        <div v-if="okMsg" class="text-sm px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">{{ okMsg }}</div>

        <div v-if="loading" class="bg-white border rounded-xl p-6 text-center text-sm text-slate-400">Cargando…</div>
        <div v-else-if="!items.length" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">
            Sin solicitudes.
        </div>

        <ul v-else class="space-y-3">
            <li v-for="ex in items" :key="ex.id" class="bg-white border rounded-xl shadow-sm p-4 space-y-3">
                <div class="flex items-start justify-between gap-3 flex-wrap">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-sm font-bold text-slate-800">{{ ex.student }}</span>
                            <span v-if="ex.numControl" class="text-[11px] font-mono text-slate-400">{{ ex.numControl }}</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="statusClass(ex.status)">
                                {{ statusLabel(ex.status) }}
                            </span>
                        </div>
                        <p class="text-sm text-slate-700 mt-1">
                            Requisito: <strong>{{ ex.requirementLabel }}</strong>
                        </p>
                        <p class="text-[11px] text-slate-400">
                            <span v-if="ex.careerName">{{ ex.careerName }}</span>
                            <span v-if="ex.modalityName"> · {{ ex.modalityName }}</span>
                            <span v-if="ex.periodName"> · {{ ex.periodName }}</span>
                        </p>
                        <p v-if="ex.studentNote" class="text-xs text-slate-500 mt-1.5 bg-slate-50 border rounded-md px-3 py-2">
                            “{{ ex.studentNote }}”
                        </p>
                        <p v-if="ex.resolutionNote" class="text-xs text-slate-500 mt-1.5">
                            <span class="font-semibold">Resolución:</span> {{ ex.resolutionNote }}
                        </p>
                    </div>
                    <div v-if="ex.status === 'pending'" class="flex items-center gap-2 shrink-0">
                        <button type="button"
                                class="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                                @click="openResolve(ex, true)">Aprobar</button>
                        <button type="button"
                                class="text-xs px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
                                @click="openResolve(ex, false)">Rechazar</button>
                    </div>
                </div>
            </li>
        </ul>

        <!-- Modal resolver -->
        <Teleport to="body">
            <div v-if="resolveModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/40" @click="resolveModal.open = false" />
                <div class="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 z-10">
                    <h3 class="text-sm font-bold text-slate-800">
                        {{ resolveModal.approve ? 'Aprobar excepción' : 'Rechazar solicitud' }}
                    </h3>
                    <p class="text-sm text-slate-600">
                        Requisito <strong>{{ resolveModal.label }}</strong> de
                        <strong>{{ resolveModal.student }}</strong>.
                    </p>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500 uppercase">
                            Comentario {{ resolveModal.approve ? '(opcional)' : '(motivo)' }}
                        </span>
                        <textarea v-model="resolveModal.note" rows="3"
                            class="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                            placeholder="Comentario para el alumno…"></textarea>
                    </label>
                    <p v-if="resolveModal.error" class="text-xs text-red-600">{{ resolveModal.error }}</p>
                    <div class="flex justify-end gap-2">
                        <button type="button" class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50"
                                :disabled="resolveModal.submitting" @click="resolveModal.open = false">Cancelar</button>
                        <button type="button"
                                class="px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
                                :class="resolveModal.approve ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'"
                                :disabled="resolveModal.submitting" @click="submitResolve">
                            {{ resolveModal.submitting ? 'Guardando…' : (resolveModal.approve ? 'Aprobar' : 'Rechazar') }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { PendingRequirementException, RequirementExceptionStatus } from '@/modules/advising/types/advising.type'

const items = ref<PendingRequirementException[]>([])
const loading = ref(false)
const statusFilter = ref('pending')
const okMsg = ref('')

const resolveModal = reactive<{
    open: boolean; id: number | null; approve: boolean; label: string; student: string;
    note: string; submitting: boolean; error: string
}>({ open: false, id: null, approve: true, label: '', student: '', note: '', submitting: false, error: '' })

function statusLabel(s: RequirementExceptionStatus): string {
    return ({ pending: 'PENDIENTE', approved: 'APROBADA', rejected: 'RECHAZADA' } as Record<string, string>)[s] ?? s.toUpperCase()
}
function statusClass(s: RequirementExceptionStatus): string {
    return ({
        pending:  'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-500'
}

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADVISING_API.requirementExceptions.pending, {
            params: { status: statusFilter.value || undefined },
        })
        items.value = Array.isArray(data?.data) ? data.data : []
    } finally {
        loading.value = false
    }
}

function openResolve(ex: PendingRequirementException, approve: boolean) {
    resolveModal.open = true
    resolveModal.id = ex.id
    resolveModal.approve = approve
    resolveModal.label = ex.requirementLabel
    resolveModal.student = ex.student
    resolveModal.note = ''
    resolveModal.error = ''
}

async function submitResolve() {
    if (resolveModal.id === null || resolveModal.submitting) return
    if (!resolveModal.approve && !resolveModal.note.trim()) {
        resolveModal.error = 'Indica el motivo del rechazo.'
        return
    }
    resolveModal.submitting = true
    resolveModal.error = ''
    try {
        const { data } = await api.post(API.ADVISING_API.requirementExceptions.resolve(resolveModal.id), {
            approve: resolveModal.approve,
            note:    resolveModal.note || null,
        })
        resolveModal.open = false
        okMsg.value = data?.message ?? 'Solicitud resuelta.'
        setTimeout(() => okMsg.value = '', 4000)
        await load()
    } catch (e: any) {
        resolveModal.error = e?.response?.data?.message ?? 'No se pudo resolver la solicitud.'
    } finally {
        resolveModal.submitting = false
    }
}

onMounted(load)
</script>
