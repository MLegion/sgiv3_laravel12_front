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

        <SkeletonText v-if="loading" :lines="3" class="bg-white border rounded-xl shadow-sm p-6" />

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
                <DataTable :columns="loadColumns" :rows="loadRows" hide-search caption="Carga del alumno" empty-text="Sin materias."
                    :row-class="(row) => row.kind === 'drop' ? 'bg-red-50/60' : row.kind === 'add' ? 'bg-emerald-50/60' : ''">
                    <template #cell-estado="{ row }">
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                            :class="row.kind === 'drop' ? 'bg-red-100 text-red-700' : row.kind === 'add' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                            {{ row.kind === 'drop' ? 'BAJA' : row.kind === 'add' ? 'ALTA' : 'INSCRITA' }}
                        </span>
                    </template>
                    <template #cell-subject="{ row }">
                        <span class="font-bold text-slate-700" :class="{ 'line-through text-red-600': row.kind === 'drop' }">{{ row.subject ?? '—' }}</span>
                        <span v-if="row.code" class="ml-2 text-[10px] font-mono text-slate-400">{{ row.code }}</span>
                    </template>
                    <template #cell-group="{ row }"><span class="text-xs font-mono text-slate-600">{{ row.group ?? '—' }}</span></template>
                    <template #cell-teacher="{ row }"><span class="text-xs text-slate-600">{{ row.teacher ?? '—' }}</span></template>
                </DataTable>
            </div>

            <!-- Historial de movimientos (altas y bajas de la solicitud) -->
            <div v-if="movements.length" class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3"><h3 class="text-sm font-bold text-slate-700 uppercase">Historial de movimientos</h3></div>
                <DataTable :columns="movementColumns" :rows="movements" hide-search caption="Historial de movimientos" empty-text="Sin movimientos."
                    :row-class="(row) => row.type === 'drop' ? 'bg-red-50/40' : 'bg-emerald-50/40'">
                    <template #cell-movimiento="{ row }">
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                            :class="row.type === 'drop' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'">
                            {{ row.type === 'drop' ? 'BAJA' : 'ALTA' }}
                        </span>
                    </template>
                    <template #cell-subject="{ row }">
                        <span class="font-bold text-slate-700" :class="{ 'line-through text-red-600': row.type === 'drop' }">{{ row.subject?.name ?? '—' }}</span>
                        <span v-if="row.subject?.officialCode" class="ml-2 text-[10px] font-mono text-slate-400">{{ row.subject?.officialCode }}</span>
                    </template>
                    <template #cell-group="{ row }"><span class="text-xs font-mono text-slate-600">{{ row.teacherAssignment?.groupName ?? '—' }}</span></template>
                    <template #cell-teacher="{ row }"><span class="text-xs text-slate-600">{{ row.teacherAssignment?.teacherName ?? '—' }}</span></template>
                    <template #cell-estado="{ row }">
                        <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                            :class="row.applied ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                            {{ row.applied ? 'APLICADA' : 'PENDIENTE' }}
                        </span>
                    </template>
                </DataTable>
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
                        aria-label="Motivo del rechazo"
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
import SkeletonText from '@/app/components/ui/SkeletonText.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

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

const loadColumns: DataTableColumn<LoadRow>[] = [
    { key: 'estado', label: 'Estado', width: '7rem' },
    { key: 'subject', label: 'Materia' },
    { key: 'group', label: 'Grupo' },
    { key: 'teacher', label: 'Docente' },
]

type MovementRow = NonNullable<AddDropRequest['items']>[number]
const movementColumns: DataTableColumn<MovementRow>[] = [
    { key: 'movimiento', label: 'Movimiento', width: '7rem' },
    { key: 'subject', label: 'Materia' },
    { key: 'group', label: 'Grupo' },
    { key: 'teacher', label: 'Docente' },
    { key: 'estado', label: 'Estado', align: 'right', width: '7rem' },
]

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
