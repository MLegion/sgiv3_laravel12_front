<template>
    <div class="space-y-4 max-w-6xl">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">
                    Asesoría #{{ session?.id ?? '—' }}
                </h1>
                <p class="text-xs text-slate-500 mt-0.5">
                    {{ session?.student?.fullName ?? '—' }}
                    <span v-if="session?.student?.numControl" class="ml-2 font-mono">{{ session.student.numControl }}</span>
                </p>
            </div>
            <div class="flex items-center gap-2">
                <span v-if="session" class="px-3 py-1 text-xs font-semibold rounded-full" :class="statusClass(session.status)">
                    {{ statusLabel(session.status) }}
                </span>
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
            </div>
        </div>

        <div v-if="errorMsg" class="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
            {{ errorMsg }}
        </div>
        <div v-if="okMsg" class="text-sm px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            {{ okMsg }}
        </div>

        <!-- Acciones de posesión y resultado -->
        <div v-if="session" class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-2">
            <button v-if="!session.reviewer"
                    class="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    @click="run('take')">TOMAR REVISIÓN</button>

            <button v-if="session.reviewer && isMine"
                    class="px-3 py-1.5 text-xs rounded-md border hover:bg-slate-50"
                    @click="run('release')">SOLTAR</button>

            <button v-if="canDecide"
                    class="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 ml-auto"
                    @click="approve">APROBAR</button>

            <button v-if="canDecide"
                    class="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                    @click="rejectPrompt">RECHAZAR</button>

            <span v-if="!isMine && session.reviewer" class="text-xs text-slate-400 italic">
                Está siendo revisada por {{ session.reviewer.name ?? 'otro asesor' }}.
            </span>
        </div>

        <!-- Items con decisión -->
        <div v-if="session" class="bg-white border rounded-xl shadow-sm">
            <div class="border-b px-4 py-3 flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Materias Propuestas</h2>
                <span class="text-xs text-slate-400">{{ session.items.length }}</span>
            </div>
            <table class="w-full text-sm">
                <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                        <th class="px-4 py-2 text-left">MATERIA</th>
                        <th class="px-4 py-2 text-left">SEM</th>
                        <th class="px-4 py-2 text-left">TIPO</th>
                        <th class="px-4 py-2 text-left">DECISIÓN</th>
                        <th class="px-4 py-2 text-left">REEMPLAZO</th>
                        <th class="px-4 py-2 text-left">NOTAS</th>
                        <th class="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="item in session.items" :key="item.id">
                        <td class="px-4 py-2">
                            <div class="font-bold text-slate-700">{{ item.subject?.name ?? '—' }}</div>
                            <div class="text-[10px] font-mono text-slate-400">
                                {{ item.subject?.code }} · {{ item.subject?.credits }} cr.
                            </div>
                        </td>
                        <td class="px-4 py-2 text-xs">{{ item.targetSemester ?? '—' }}</td>
                        <td class="px-4 py-2">
                            <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                  :class="attemptClass(item)">
                                {{ attemptLabel(item) }}
                            </span>
                        </td>
                        <td class="px-4 py-2">
                            <select v-if="decisions[item.id]"
                                    :disabled="!canDecide || savingItem === item.id"
                                    v-model="decisions[item.id]!.advisor_status"
                                    class="text-[11px] border rounded-md px-2 py-1">
                                <option value="proposed">Pendiente</option>
                                <option value="accepted">Aceptar</option>
                                <option value="rejected">Rechazar</option>
                                <option value="replaced">Reemplazar</option>
                            </select>
                        </td>
                        <td class="px-4 py-2">
                            <input v-if="decisions[item.id] && decisions[item.id]!.advisor_status === 'replaced'"
                                   type="number"
                                   v-model.number="decisions[item.id]!.replacement_subject_id"
                                   placeholder="ID materia"
                                   :disabled="!canDecide || savingItem === item.id"
                                   class="text-[11px] border rounded-md px-2 py-1 w-24" />
                            <span v-else-if="item.replacementSubject" class="text-[11px] text-slate-500">
                                {{ item.replacementSubject.name }}
                            </span>
                        </td>
                        <td class="px-4 py-2">
                            <input v-if="decisions[item.id]"
                                   v-model="decisions[item.id]!.advisor_notes"
                                   placeholder="Notas..."
                                   :disabled="!canDecide || savingItem === item.id"
                                   class="text-[11px] border rounded-md px-2 py-1 w-full" />
                        </td>
                        <td class="px-4 py-2 text-right">
                            <button v-if="canDecide"
                                    :disabled="savingItem === item.id"
                                    class="text-[11px] border px-2 py-1 rounded-md hover:bg-blue-50 hover:border-blue-300 text-blue-600 disabled:opacity-50"
                                    @click="saveDecision(item.id)">
                                {{ savingItem === item.id ? '…' : 'GUARDAR' }}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Notas -->
        <div v-if="session" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white border rounded-xl shadow-sm p-4">
                <h3 class="text-xs font-bold uppercase text-slate-500 mb-2">Notas del alumno</h3>
                <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ session.studentNotes ?? '—' }}</p>
            </div>
            <div class="bg-white border rounded-xl shadow-sm p-4">
                <h3 class="text-xs font-bold uppercase text-slate-500 mb-2">Notas del asesor</h3>
                <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ session.advisorNotes ?? '—' }}</p>
                <p v-if="session.rejectionReason" class="text-sm text-red-600 mt-3">
                    <strong>Razón de rechazo:</strong> {{ session.rejectionReason }}
                </p>
            </div>
        </div>

        <!-- Audit log -->
        <div v-if="session" class="bg-white border rounded-xl shadow-sm">
            <div class="border-b px-4 py-3 flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Bitácora</h2>
                <span class="text-xs text-slate-400">{{ auditLog.length }} eventos</span>
            </div>
            <div class="divide-y max-h-96 overflow-y-auto">
                <div v-for="entry in auditLog" :key="entry.id" class="px-4 py-2 flex items-center justify-between">
                    <div class="flex flex-col">
                        <span class="text-xs font-bold text-slate-700">{{ entry.action }}</span>
                        <span class="text-[10px] text-slate-400 font-mono">{{ entry.actor?.name ?? '—' }} · {{ entry.actorRole ?? '' }}</span>
                    </div>
                    <span class="text-[10px] text-slate-400">{{ formatDate(entry.createdAt) }}</span>
                </div>
                <div v-if="!auditLog.length" class="px-4 py-6 text-center text-xs text-slate-400">
                    Sin eventos.
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { AdvisingSession, AdvisingSessionItem, AdvisingAuditLogEntry, AdvisingStatus } from '@/modules/advising/types/advising.type'

const route  = useRoute()
const router = useRouter()
const sessionId = Number(route.params.id)

const session   = ref<AdvisingSession | null>(null)
const auditLog  = ref<AdvisingAuditLogEntry[]>([])
const errorMsg  = ref('')
const okMsg     = ref('')
const savingItem = ref<number | null>(null)

interface ItemDecision {
    advisor_status: 'proposed' | 'accepted' | 'rejected' | 'replaced'
    advisor_notes: string | null
    replacement_subject_id: number | null
}

const decisions = reactive<Record<number, ItemDecision>>({})

const currentUserId = computed(() => {
    try {
        const u = JSON.parse(localStorage.getItem('user') ?? '{}')
        return u?.id ?? null
    } catch { return null }
})

const isMine    = computed(() => session.value?.reviewer?.id === currentUserId.value)
const canDecide = computed(() => session.value?.status === 'submitted' && isMine.value)

async function load() {
    try {
        const [s, log] = await Promise.all([
            api.get(API.ADVISING_API.sessions.byId(sessionId)),
            api.get(API.ADVISING_API.sessions.auditLog(sessionId)),
        ])
        session.value = s.data
        auditLog.value = log.data ?? []
        for (const item of session.value?.items ?? []) {
            decisions[item.id] = {
                advisor_status:         item.advisorStatus,
                advisor_notes:          item.advisorNotes,
                replacement_subject_id: item.replacementSubjectId,
            }
        }
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message ?? 'Error al cargar la asesoría.'
    }
}
onMounted(load)

async function run(action: 'take' | 'release') {
    errorMsg.value = ''
    try {
        const fn = action === 'take' ? API.ADVISING_API.sessions.take : API.ADVISING_API.sessions.release
        await api.post(fn(sessionId))
        await load()
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message ?? `Error al ${action}.`
    }
}

async function saveDecision(itemId: number) {
    if (!canDecide.value) return
    savingItem.value = itemId
    errorMsg.value = ''
    try {
        await api.patch(API.ADVISING_API.sessions.updateItem(sessionId, itemId), decisions[itemId])
        okMsg.value = 'Decisión guardada.'
        setTimeout(() => okMsg.value = '', 1500)
        await load()
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message ?? 'Error al guardar decisión.'
    } finally {
        savingItem.value = null
    }
}

async function approve() {
    if (!canDecide.value) return
    if (!confirm('¿Aprobar esta asesoría? Esta acción es irreversible.')) return
    errorMsg.value = ''
    try {
        await api.post(API.ADVISING_API.sessions.approve(sessionId), {})
        okMsg.value = 'Asesoría aprobada.'
        await load()
    } catch (e: any) {
        const violations = e?.response?.data?.context?.violations
        errorMsg.value = Array.isArray(violations) && violations[0]?.message
            ? violations[0].message
            : (e?.response?.data?.message ?? 'Error al aprobar.')
    }
}

async function rejectPrompt() {
    if (!canDecide.value) return
    const reason = prompt('Razón del rechazo (mínimo 5 caracteres):')
    if (!reason || reason.trim().length < 5) return
    errorMsg.value = ''
    try {
        await api.post(API.ADVISING_API.sessions.reject(sessionId), { reason: reason.trim() })
        okMsg.value = 'Asesoría rechazada.'
        await load()
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message ?? 'Error al rechazar.'
    }
}

function statusLabel(status: AdvisingStatus): string {
    return ({
        draft: 'BORRADOR', submitted: 'ENVIADA', approved: 'APROBADA',
        rejected: 'RECHAZADA', cancelled: 'CANCELADA',
    } as Record<AdvisingStatus, string>)[status] ?? status.toUpperCase()
}
function statusClass(status: AdvisingStatus): string {
    return ({
        draft: 'bg-slate-100 text-slate-600',
        submitted: 'bg-blue-100 text-blue-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        cancelled: 'bg-slate-200 text-slate-500',
    } as Record<AdvisingStatus, string>)[status] ?? ''
}
function attemptLabel(item: AdvisingSessionItem): string {
    if (item.isSpecial) return 'ESPECIAL'
    if (item.isRepeat)  return 'REPITE'
    return 'NORMAL'
}
function attemptClass(item: AdvisingSessionItem): string {
    if (item.isSpecial) return 'bg-red-100 text-red-700'
    if (item.isRepeat)  return 'bg-orange-100 text-orange-700'
    return 'bg-slate-100 text-slate-600'
}
function formatDate(s: string | null): string {
    if (!s) return '—'
    return new Date(s).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>
