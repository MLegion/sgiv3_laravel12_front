<template>
    <div class="space-y-4 max-w-5xl">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Altas y Bajas #{{ request?.id ?? '—' }}</h1>
            <div class="flex items-center gap-2">
                <span v-if="request" class="px-3 py-1 text-xs font-semibold rounded-full" :class="statusClass(request.status)">
                    {{ statusLabel(request.status) }}
                </span>
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
            </div>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl shadow-sm p-6 text-center text-sm text-slate-400">Cargando…</div>

        <template v-else-if="request">
            <!-- Alumno -->
            <div class="bg-white border rounded-xl shadow-sm p-4">
                <div class="text-base font-bold text-slate-800 uppercase">{{ request.student?.fullName ?? '—' }}</div>
                <div class="text-xs text-slate-500 font-mono">
                    N° control: {{ request.student?.numControl ?? '—' }} ·
                    Periodo: {{ request.period?.shortName ?? request.period?.name ?? '—' }}
                </div>
                <div v-if="request.autoApproved" class="mt-1 text-[11px] text-emerald-600">Aprobada automáticamente por el jefe.</div>
            </div>

            <div v-if="errorMsg" class="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">{{ errorMsg }}</div>
            <div v-if="okMsg"    class="text-sm px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">{{ okMsg }}</div>
            <div v-if="violations.length" class="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
                <h3 class="text-xs font-bold text-amber-700 uppercase mb-2">No se pudo aprobar</h3>
                <ul class="text-sm text-amber-700 list-disc list-inside space-y-0.5">
                    <li v-for="(v, i) in violations" :key="i">{{ v.message }}</li>
                </ul>
            </div>

            <!-- Bajas -->
            <div class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3"><h3 class="text-sm font-bold text-red-700 uppercase">Bajas solicitadas</h3></div>
                <table class="w-full text-sm">
                    <tbody class="divide-y">
                        <tr v-for="it in dropItems" :key="it.id">
                            <td class="px-4 py-2">
                                <span class="font-bold text-slate-700 line-through">{{ it.subject?.name ?? '—' }}</span>
                                <span class="ml-2 text-[10px] font-mono text-slate-400">{{ it.subject?.officialCode }}</span>
                            </td>
                        </tr>
                        <tr v-if="!dropItems.length"><td class="px-4 py-4 text-center text-xs text-slate-400">Sin bajas.</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Altas -->
            <div class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3"><h3 class="text-sm font-bold text-emerald-700 uppercase">Altas solicitadas</h3></div>
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                        <tr><th scope="col" class="px-4 py-2 text-left">MATERIA</th><th scope="col" class="px-4 py-2 text-left">GRUPO</th><th scope="col" class="px-4 py-2 text-left">DOCENTE</th></tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="it in addItems" :key="it.id">
                            <td class="px-4 py-2 font-bold text-slate-700">{{ it.subject?.name ?? '—' }}</td>
                            <td class="px-4 py-2 text-xs font-mono">{{ it.teacherAssignment?.groupName ?? '—' }}</td>
                            <td class="px-4 py-2 text-xs text-slate-600">{{ it.teacherAssignment?.teacherName ?? '—' }}</td>
                        </tr>
                        <tr v-if="!addItems.length"><td colspan="3" class="px-4 py-4 text-center text-xs text-slate-400">Sin altas.</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Acciones del jefe -->
            <div v-if="request.status === 'submitted'" class="flex justify-end gap-2">
                <button type="button" :disabled="busy"
                    class="px-4 py-2 text-sm rounded-md border text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-40"
                    @click="rejectOpen = true">
                    Rechazar
                </button>
                <button type="button" :disabled="busy"
                    class="px-5 py-2 text-sm rounded-md bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-40"
                    @click="approve">
                    {{ busy ? 'Aplicando…' : 'Aprobar y aplicar' }}
                </button>
            </div>
            <p v-else-if="request.status === 'rejected' && request.rejectionReason" class="text-sm text-red-600">
                Rechazada: {{ request.rejectionReason }}
            </p>
        </template>

        <!-- Modal rechazo -->
        <Teleport to="body">
            <div v-if="rejectOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/40" @click="rejectOpen = false" />
                <div class="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 z-10">
                    <h3 class="text-sm font-bold text-slate-800 uppercase">Rechazar solicitud</h3>
                    <textarea v-model="rejectReason" rows="3" class="w-full border rounded-md px-3 py-2 text-sm"
                        placeholder="Motivo del rechazo (mínimo 5 caracteres)…" />
                    <div class="flex justify-end gap-2">
                        <button type="button" class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50" :disabled="busy" @click="rejectOpen = false">Cancelar</button>
                        <button type="button" class="px-4 py-2 text-sm rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-40"
                            :disabled="busy || rejectReason.trim().length < 5" @click="reject">
                            {{ busy ? 'Enviando…' : 'Rechazar' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { AddDropRequest, AdvisingStatus, PolicyViolation } from '@/modules/advising/types/advising.type'

const route  = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const request = ref<AddDropRequest | null>(null)
const loading = ref(true)
const busy    = ref(false)
const errorMsg = ref('')
const okMsg    = ref('')
const violations = ref<PolicyViolation[]>([])
const rejectOpen = ref(false)
const rejectReason = ref('')

const addItems  = computed(() => (request.value?.items ?? []).filter(i => i.type === 'add'))
const dropItems = computed(() => (request.value?.items ?? []).filter(i => i.type === 'drop'))

function extractMsg(e: any): string { return e?.response?.data?.message ?? 'Error al procesar la solicitud.' }
function handleError(e: any) {
    const v = e?.response?.data?.violations
    violations.value = Array.isArray(v) ? v : []
    errorMsg.value = extractMsg(e)
}

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADVISING_API.addDrop.byId(id))
        request.value = data ?? null
    } catch (e: any) {
        errorMsg.value = extractMsg(e)
    } finally {
        loading.value = false
    }
}

async function approve() {
    if (busy.value) return
    busy.value = true
    errorMsg.value = ''; okMsg.value = ''; violations.value = []
    try {
        const { data } = await api.post(API.ADVISING_API.addDrop.approve(id))
        request.value = data ?? request.value
        okMsg.value = 'Solicitud aprobada y aplicada a la carga del alumno.'
    } catch (e: any) {
        handleError(e)
    } finally {
        busy.value = false
    }
}

async function reject() {
    if (busy.value || rejectReason.value.trim().length < 5) return
    busy.value = true
    errorMsg.value = ''; okMsg.value = ''; violations.value = []
    try {
        const { data } = await api.post(API.ADVISING_API.addDrop.reject(id), { reason: rejectReason.value.trim() })
        request.value = data ?? request.value
        rejectOpen.value = false
        okMsg.value = 'Solicitud rechazada.'
    } catch (e: any) {
        handleError(e)
    } finally {
        busy.value = false
    }
}

function statusLabel(s: AdvisingStatus): string {
    return ({ draft: 'BORRADOR', submitted: 'ENVIADA', approved: 'APROBADA', rejected: 'RECHAZADA', cancelled: 'CANCELADA' } as Record<AdvisingStatus, string>)[s]
}
function statusClass(s: AdvisingStatus): string {
    return ({
        draft: 'bg-slate-100 text-slate-600',
        submitted: 'bg-blue-100 text-blue-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        cancelled: 'bg-slate-200 text-slate-500',
    } as Record<AdvisingStatus, string>)[s] ?? 'bg-slate-100 text-slate-600'
}

onMounted(load)
</script>
