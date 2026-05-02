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

        <!-- Avance del estudiante (visión general antes de decidir) -->
        <div v-if="session && curriculum" class="bg-white border rounded-xl shadow-sm">
            <div class="border-b px-4 py-3 flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Avance del estudiante</h2>
                <span v-if="curriculum.studyPlan" class="text-xs text-slate-500 truncate max-w-[60%] text-right">
                    {{ curriculum.studyPlan.careerName ?? curriculum.studyPlan.name }}
                    <span v-if="curriculum.studyPlan.officialCode" class="text-slate-400 ml-1">({{ curriculum.studyPlan.officialCode }})</span>
                </span>
            </div>

            <div class="p-4 space-y-3">
                <!-- Asignación pendiente -->
                <div v-if="curriculum.needsSpecialty || curriculum.needsOptionalGroup"
                     class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-0.5">
                    <strong class="block uppercase tracking-wider">Asignación pendiente</strong>
                    <p v-if="curriculum.needsSpecialty">
                        El alumno aún no tiene asignada una <strong>especialidad</strong>; las materias de
                        especialidad no se cuentan en su avance.
                    </p>
                    <p v-if="curriculum.needsOptionalGroup">
                        El alumno aún no tiene asignado <strong>grupo de optativas</strong>.
                    </p>
                </div>

                <!-- Header de progreso -->
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Avance</div>
                        <div class="text-2xl font-extrabold text-blue-700 mt-0.5">
                            {{ curriculum.progressPercent ?? 0 }}<span class="text-sm text-blue-400">%</span>
                        </div>
                        <div class="mt-1 flex flex-wrap gap-1">
                            <span v-if="curriculum.assignedSpecialty"
                                  class="text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold uppercase tracking-tight">
                                Especialidad: {{ curriculum.assignedSpecialty.name }}
                            </span>
                            <span v-if="curriculum.assignedOptionalGroup"
                                  class="text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold uppercase tracking-tight">
                                Optativas: {{ curriculum.assignedOptionalGroup.name }}
                            </span>
                            <span v-if="curriculum.studentCurrentPeriodNumber"
                                  class="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase tracking-tight">
                                {{ curriculum.studentCurrentPeriodNumber }}° semestre
                            </span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Créditos</div>
                        <div class="text-xl font-bold text-slate-700 mt-0.5">
                            {{ curriculum.creditsEarned ?? 0 }}<span class="text-slate-400 mx-1">/</span>{{ curriculum.totalCredits ?? 0 }}
                        </div>
                        <div class="text-[10px] text-slate-500">
                            {{ (curriculum.totalCredits ?? 0) - (curriculum.creditsEarned ?? 0) }} cr. restantes
                        </div>
                    </div>
                </div>

                <!-- Barra de progreso -->
                <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                         :style="{ width: (curriculum.progressPercent ?? 0) + '%' }" />
                </div>

                <!-- Conteos rápidos -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div class="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                        <div class="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Aprobadas</div>
                        <div class="text-base font-bold text-emerald-700">{{ counts.aprobadas }}</div>
                    </div>
                    <div class="bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
                        <div class="text-[10px] font-black text-orange-600 uppercase tracking-wider">Repite</div>
                        <div class="text-base font-bold text-orange-700">{{ counts.repite }}</div>
                    </div>
                    <div class="bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        <div class="text-[10px] font-black text-red-600 uppercase tracking-wider">Especial</div>
                        <div class="text-base font-bold text-red-700">{{ counts.especial }}</div>
                    </div>
                    <div class="bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                        <div class="text-[10px] font-black text-slate-500 uppercase tracking-wider">Por cursar</div>
                        <div class="text-base font-bold text-slate-700">{{ counts.normal }}</div>
                    </div>
                </div>
            </div>
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

        <!-- Razón de rechazo (si aplica) -->
        <div v-if="session?.rejectionReason" class="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 class="text-xs font-bold text-red-700 uppercase mb-1">Razón del rechazo</h3>
            <p class="text-sm text-red-700 whitespace-pre-wrap">{{ session.rejectionReason }}</p>
        </div>

    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { AdvisingSession, AdvisingSessionItem, AdvisingStatus, CurriculumStatus } from '@/modules/advising/types/advising.type'

const route  = useRoute()
const router = useRouter()
const sessionId = Number(route.params.id)

const session   = ref<AdvisingSession | null>(null)
const curriculum = ref<CurriculumStatus | null>(null)
const errorMsg  = ref('')
const okMsg     = ref('')
const savingItem = ref<number | null>(null)

interface ItemDecision {
    advisor_status: 'proposed' | 'accepted' | 'rejected' | 'replaced'
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

const counts = computed(() => {
    const subs = curriculum.value?.subjects ?? []
    const filtered = subs.filter(s => s.countsForStudent)
    return {
        aprobadas: filtered.filter(s => s.attempt === 'aprobada').length,
        repite:    filtered.filter(s => s.attempt === 'repite').length,
        especial:  filtered.filter(s => s.attempt === 'especial').length,
        normal:    filtered.filter(s => s.attempt === 'normal').length,
    }
})

async function load() {
    try {
        const { data } = await api.get(API.ADVISING_API.sessions.byId(sessionId))
        session.value = data
        for (const item of session.value?.items ?? []) {
            decisions[item.id] = {
                advisor_status:         item.advisorStatus,
                replacement_subject_id: item.replacementSubjectId,
            }
        }
        // Avance del estudiante (carga en paralelo, no bloquea la UI principal).
        const studentId = session.value?.student?.id ?? session.value?.studentId
        const periodId  = session.value?.collegeAcademicPeriodId
        if (studentId) {
            api.get(API.ADVISING_API.students.curriculum(studentId), {
                params: periodId ? { college_academic_period_id: periodId } : {},
            }).then(r => { curriculum.value = r.data })
              .catch(() => { /* informativo, no bloquea */ })
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
</script>
