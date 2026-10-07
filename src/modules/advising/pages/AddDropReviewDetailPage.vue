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

            <!-- Carga resultante: inscritas + BAJA (tachada) + ALTA (verde) -->
            <div class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3 flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">Carga del alumno</h3>
                    <div class="flex items-center gap-3 text-[10px] uppercase tracking-wide">
                        <span class="inline-flex items-center gap-1 text-slate-500"><span class="w-2.5 h-2.5 rounded-sm bg-slate-200"></span>Inscrita</span>
                        <span class="inline-flex items-center gap-1 text-red-600"><span class="w-2.5 h-2.5 rounded-sm bg-red-200"></span>Baja</span>
                        <span class="inline-flex items-center gap-1 text-emerald-600"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-200"></span>Alta</span>
                    </div>
                </div>
                <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th scope="col" class="px-4 py-2 text-left w-28">ESTADO</th>
                            <th scope="col" class="px-4 py-2 text-left">MATERIA</th>
                            <th scope="col" class="px-4 py-2 text-left">GRUPO</th>
                            <th scope="col" class="px-4 py-2 text-left">DOCENTE</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="row in loadRows" :key="row.key"
                            :class="row.kind === 'drop' ? 'bg-red-50/60' : row.kind === 'add' ? 'bg-emerald-50/60' : ''">
                            <td class="px-4 py-2">
                                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                                    :class="row.kind === 'drop' ? 'bg-red-100 text-red-700' : row.kind === 'add' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                                    {{ row.kind === 'drop' ? 'BAJA' : row.kind === 'add' ? 'ALTA' : 'INSCRITA' }}
                                </span>
                            </td>
                            <td class="px-4 py-2">
                                <span class="font-bold text-slate-700" :class="{ 'line-through text-red-600': row.kind === 'drop' }">{{ row.subject ?? '—' }}</span>
                                <span v-if="row.code" class="ml-2 text-[10px] font-mono text-slate-400">{{ row.code }}</span>
                            </td>
                            <td class="px-4 py-2 text-xs font-mono text-slate-600">{{ row.group ?? '—' }}</td>
                            <td class="px-4 py-2 text-xs text-slate-600">{{ row.teacher ?? '—' }}</td>
                        </tr>
                        <tr v-if="!loadRows.length"><td colspan="4" class="px-4 py-4 text-center text-xs text-slate-400">Sin materias.</td></tr>
                    </tbody>
                </table></div>
            </div>

            <!-- Historial de movimientos (altas y bajas de la solicitud) -->
            <div v-if="movements.length" class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3"><h3 class="text-sm font-bold text-slate-700 uppercase">Historial de movimientos</h3></div>
                <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th scope="col" class="px-4 py-2 text-left w-28">MOVIMIENTO</th>
                            <th scope="col" class="px-4 py-2 text-left">MATERIA</th>
                            <th scope="col" class="px-4 py-2 text-left">GRUPO</th>
                            <th scope="col" class="px-4 py-2 text-left">DOCENTE</th>
                            <th scope="col" class="px-4 py-2 text-right w-28">ESTADO</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="it in movements" :key="`mv-${it.id}`"
                            :class="it.type === 'drop' ? 'bg-red-50/40' : 'bg-emerald-50/40'">
                            <td class="px-4 py-2">
                                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                                    :class="it.type === 'drop' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'">
                                    {{ it.type === 'drop' ? 'BAJA' : 'ALTA' }}
                                </span>
                            </td>
                            <td class="px-4 py-2">
                                <span class="font-bold text-slate-700" :class="{ 'line-through text-red-600': it.type === 'drop' }">{{ it.subject?.name ?? '—' }}</span>
                                <span v-if="it.subject?.officialCode" class="ml-2 text-[10px] font-mono text-slate-400">{{ it.subject?.officialCode }}</span>
                            </td>
                            <td class="px-4 py-2 text-xs font-mono text-slate-600">{{ it.teacherAssignment?.groupName ?? '—' }}</td>
                            <td class="px-4 py-2 text-xs text-slate-600">{{ it.teacherAssignment?.teacherName ?? '—' }}</td>
                            <td class="px-4 py-2 text-right">
                                <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                    :class="it.applied ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                                    {{ it.applied ? 'APLICADA' : 'PENDIENTE' }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table></div>
            </div>

            <!-- Info de aval (para la etapa final de Servicios Escolares) -->
            <p v-if="isSes && request.status === 'endorsed' && request.endorser" class="text-xs text-amber-700">
                Avalada por {{ request.endorser?.name ?? '—' }}{{ request.endorsedAt ? ' · ' + formatDate(request.endorsedAt) : '' }}.
            </p>

            <!-- Acciones -->
            <div v-if="request.status === actionableStatus" class="flex justify-end gap-2">
                <button type="button" :disabled="busy"
                    class="px-4 py-2 text-sm rounded-md border text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-40"
                    @click="rejectOpen = true">
                    Rechazar
                </button>
                <button v-if="isSes" type="button" :disabled="busy"
                    class="px-5 py-2 text-sm rounded-md bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-40"
                    @click="approve">
                    {{ busy ? 'Aplicando…' : 'Aprobar y aplicar' }}
                </button>
                <button v-else type="button" :disabled="busy"
                    class="px-5 py-2 text-sm rounded-md bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-40"
                    @click="endorse">
                    {{ busy ? 'Avalando…' : 'Avalar' }}
                </button>
            </div>
            <p v-else-if="request.status === 'endorsed' && !isSes" class="text-sm text-amber-700 text-right">
                Avalada. Pendiente de aprobación final de Servicios Escolares.
            </p>
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

// Alcance: 'ses' (aprobación final) o 'career' (aval del jefe, por defecto).
const isSes = computed(() => route.meta?.scope === 'ses')
const actionableStatus = computed<AdvisingStatus>(() => (isSes.value ? 'endorsed' : 'submitted'))

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
const movements = computed(() => request.value?.items ?? [])

interface LoadRow { key: string; kind: 'keep' | 'drop' | 'add'; subject: string | null; code: string | null; group: string | null; teacher: string | null }

// Carga resultante unificada: cada materia inscrita (marcada BAJA si se solicita
// dar de baja) seguida de las altas solicitadas marcadas en verde.
const loadRows = computed<LoadRow[]>(() => {
    const req = request.value
    if (!req) return []
    const droppedEnrollmentIds = new Set(dropItems.value.map(i => i.sourceEnrollmentId).filter((v): v is number => v != null))
    const droppedSubjectIds    = new Set(dropItems.value.map(i => i.subjectId))

    const current = (req.currentLoad ?? []).map<LoadRow>(e => {
        const isDrop = droppedEnrollmentIds.has(e.id) || droppedSubjectIds.has(e.subject?.id ?? -1)
        return {
            key: `enr-${e.id}`,
            kind: isDrop ? 'drop' : 'keep',
            subject: e.subject?.name ?? null,
            code: e.subject?.official_code ?? null,
            group: e.group?.name ?? null,
            teacher: e.teacher?.name ?? null,
        }
    })

    // Las altas ya APLICADAS pasan a formar parte de currentLoad (aparecen como
    // INSCRITA); sólo mostramos como "ALTA" las pendientes, para no duplicar.
    const adds = addItems.value.filter(it => !it.applied).map<LoadRow>(it => ({
        key: `add-${it.id}`,
        kind: 'add',
        subject: it.subject?.name ?? null,
        code: it.subject?.officialCode ?? null,
        group: it.teacherAssignment?.groupName ?? null,
        teacher: it.teacherAssignment?.teacherName ?? null,
    }))

    return [...current, ...adds]
})

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
        await api.post(API.ADVISING_API.addDrop.approve(id))
        await load() // re-trae currentLoad (los endpoints de acción no lo incluyen)
        okMsg.value = 'Solicitud aprobada y aplicada a la carga del alumno.'
    } catch (e: any) {
        handleError(e)
    } finally {
        busy.value = false
    }
}

async function endorse() {
    if (busy.value) return
    busy.value = true
    errorMsg.value = ''; okMsg.value = ''; violations.value = []
    try {
        await api.post(API.ADVISING_API.addDrop.endorse(id))
        await load() // re-trae currentLoad (los endpoints de acción no lo incluyen)
        okMsg.value = 'Solicitud avalada. Pendiente de aprobación final de Servicios Escolares.'
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
        await api.post(API.ADVISING_API.addDrop.reject(id), { reason: rejectReason.value.trim() })
        rejectOpen.value = false
        await load() // re-trae currentLoad (los endpoints de acción no lo incluyen)
        okMsg.value = 'Solicitud rechazada.'
    } catch (e: any) {
        handleError(e)
    } finally {
        busy.value = false
    }
}

function statusLabel(s: AdvisingStatus): string {
    return ({ draft: 'BORRADOR', submitted: 'ENVIADA', endorsed: 'AVALADA', approved: 'APROBADA', rejected: 'RECHAZADA', cancelled: 'CANCELADA' } as Record<AdvisingStatus, string>)[s]
}
function statusClass(s: AdvisingStatus): string {
    return ({
        draft: 'bg-slate-100 text-slate-600',
        submitted: 'bg-blue-100 text-blue-700',
        endorsed: 'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        cancelled: 'bg-slate-200 text-slate-500',
    } as Record<AdvisingStatus, string>)[s] ?? 'bg-slate-100 text-slate-600'
}
function formatDate(s: string | null): string {
    if (!s) return '—'
    return new Date(s).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(load)
</script>
