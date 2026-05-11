<template>
    <div class="space-y-4 max-w-6xl">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Asesoría #{{ session?.id ?? '—' }}</h1>
            <div class="flex items-center gap-2">
                <span v-if="session" class="px-3 py-1 text-xs font-semibold rounded-full" :class="statusClass(session.status)">
                    {{ statusLabel(session.status) }}
                </span>
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
            </div>
        </div>

        <!-- Tarjeta del estudiante -->
        <div v-if="session" class="bg-white border rounded-xl shadow-sm p-4 flex items-start gap-4">
            <div class="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300 flex-shrink-0">
                <img v-if="!avatarFailed && studentId" :src="avatarUrl" alt="Foto del alumno" class="w-full h-full object-cover" @error="avatarFailed = true" />
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            </div>
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm min-w-0">
                <div class="sm:col-span-2">
                    <div class="text-base font-bold text-slate-800 uppercase">{{ session.student?.fullName ?? '—' }}</div>
                    <div class="text-xs text-slate-500 font-mono">N° control: {{ session.student?.numControl ?? '—' }}</div>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                    <span class="text-slate-400 uppercase">Plan</span>
                    <span class="text-slate-700 truncate">{{ planLabel }}</span>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                    <span class="text-slate-400 uppercase">Modalidad</span>
                    <span class="text-slate-700 truncate">{{ curriculum?.modality?.typeShort ?? curriculum?.modality?.typeName ?? '—' }}</span>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                    <span class="text-slate-400 uppercase">Campus</span>
                    <span class="text-slate-700 truncate">{{ curriculum?.campus?.name ?? '—' }}</span>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                    <span class="text-slate-400 uppercase">Semestre</span>
                    <span class="text-slate-700">{{ curriculum?.studentCurrentPeriodNumber ? curriculum.studentCurrentPeriodNumber + '°' : '—' }}</span>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                    <span class="text-slate-400 uppercase">Especialidad</span>
                    <span :class="curriculum?.assignedSpecialty ? 'text-slate-700' : 'text-slate-400 italic'" class="truncate">
                        {{ curriculum?.assignedSpecialty?.name ?? 'sin asignar' }}
                    </span>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                    <span class="text-slate-400 uppercase">Optativas</span>
                    <span :class="curriculum?.assignedOptionalGroup ? 'text-slate-700' : 'text-slate-400 italic'" class="truncate">
                        {{ curriculum?.assignedOptionalGroup?.name ?? 'sin asignar' }}
                    </span>
                </div>
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

                <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                         :style="{ width: (curriculum.progressPercent ?? 0) + '%' }" />
                </div>

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
                        <td class="px-4 py-2 text-right space-x-1 whitespace-nowrap">
                            <button v-if="canDecide"
                                    :disabled="savingItem === item.id"
                                    class="text-[11px] border px-2 py-1 rounded-md hover:bg-blue-50 hover:border-blue-300 text-blue-600 disabled:opacity-50"
                                    @click="saveDecision(item.id)">
                                {{ savingItem === item.id ? '…' : 'GUARDAR' }}
                            </button>
                            <button v-if="canDecide"
                                    :disabled="removingSubject === item.subjectId"
                                    class="text-[11px] border px-2 py-1 rounded-md hover:bg-red-50 hover:border-red-300 text-red-600 disabled:opacity-50"
                                    title="Quitar de la sesión"
                                    @click="removeItem(item.subjectId)">
                                {{ removingSubject === item.subjectId ? '…' : 'QUITAR' }}
                            </button>
                        </td>
                    </tr>
                    <tr v-if="session.items.length === 0">
                        <td colspan="6" class="px-4 py-8 text-center text-xs text-slate-400 italic">
                            Sin materias propuestas. Agrégalas desde la sección de abajo.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Materias Aperturadas (agregar como asesor) -->
        <div v-if="canDecide && curriculum" class="bg-white border rounded-xl shadow-sm">
            <div class="border-b px-4 py-3 flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Materias Aperturadas</h2>
                <span class="text-xs text-slate-400">{{ availableForAdd.length }} disponibles</span>
            </div>

            <div v-if="blockedByRepeats" class="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700">
                <strong>{{ repeatCount }}+ repites</strong>: el alumno tiene bloqueo total. Agregar una materia requerirá aplicar excepción.
            </div>
            <div v-else-if="onlySpecials" class="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700">
                <strong>2-4 repites</strong>: regla legacy permite sólo materias en especial. Agregar otras requerirá excepción.
            </div>

            <table class="w-full text-sm">
                <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                        <th class="px-4 py-2 text-left">MATERIA</th>
                        <th class="px-4 py-2 text-left">SEM</th>
                        <th class="px-4 py-2 text-left">TIPO</th>
                        <th class="px-4 py-2 text-left">GRUPO</th>
                        <th class="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="entry in availableForAdd" :key="entry.subjectId">
                        <td class="px-4 py-2">
                            <div class="font-bold text-slate-700">{{ entry.subject?.name ?? '—' }}</div>
                            <div class="text-[10px] font-mono text-slate-400">
                                {{ entry.subject?.officialCode ?? entry.subject?.code }} · {{ entry.subject?.credits ?? 0 }} cr.
                            </div>
                        </td>
                        <td class="px-4 py-2 text-xs">{{ entry.period ?? '—' }}</td>
                        <td class="px-4 py-2">
                            <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                  :class="attemptColorByEntry(entry)">
                                {{ attemptLabelByEntry(entry) }}
                            </span>
                        </td>
                        <td class="px-4 py-2">
                            <select v-model="selectedAssignment[entry.subjectId]"
                                    class="text-[11px] border rounded-md px-2 py-1 max-w-[260px]">
                                <option :value="null">Selecciona grupo…</option>
                                <option v-for="a in (entry.offer?.assignments ?? [])" :key="a.assignmentId" :value="a.assignmentId">
                                    {{ a.groupName }} · {{ a.teacherName ?? 'Por asignar' }}
                                </option>
                            </select>
                        </td>
                        <td class="px-4 py-2 text-right">
                            <button :disabled="!selectedAssignment[entry.subjectId] || addingSubject === entry.subjectId"
                                    class="text-[11px] border px-2 py-1 rounded-md hover:bg-emerald-50 hover:border-emerald-300 text-emerald-600 disabled:opacity-40"
                                    @click="addItem(entry, selectedAssignment[entry.subjectId]!)">
                                {{ addingSubject === entry.subjectId ? '…' : 'AGREGAR' }}
                            </button>
                        </td>
                    </tr>
                    <tr v-if="availableForAdd.length === 0">
                        <td colspan="5" class="px-4 py-8 text-center text-xs text-slate-400 italic">
                            No hay materias disponibles para agregar (todas las ofertadas ya están propuestas o no aplican).
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

        <!-- Modal de excepción -->
        <Teleport to="body">
            <div v-if="overrideModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                    <h3 class="text-base font-bold text-slate-800 uppercase">Aplicar excepción</h3>
                    <p class="text-sm text-slate-600">
                        La inscripción de <strong>{{ overrideModal.entry.subject?.name }}</strong> tiene un problema:
                    </p>
                    <ul class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-3 space-y-1">
                        <li v-for="(msg, i) in overrideModal.messages" :key="i">• {{ msg }}</li>
                    </ul>
                    <p class="text-xs text-slate-500">
                        Como asesor activo puedes <strong>permitirla con excepción</strong>. Se ignorará la regla y la materia
                        quedará agregada a la sesión.
                    </p>
                    <div class="flex justify-end gap-2 pt-2">
                        <button class="px-4 py-2 text-sm rounded-md border hover:bg-slate-50" @click="overrideModal = null">
                            CANCELAR
                        </button>
                        <button class="px-4 py-2 text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700"
                                @click="confirmOverride">
                            APROBAR EXCEPCIÓN
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type {
    AdvisingSession, AdvisingSessionItem, AdvisingStatus,
    CurriculumStatus, CurriculumStatusEntry,
} from '@/modules/advising/types/advising.type'

const route  = useRoute()
const router = useRouter()
const sessionId = Number(route.params.id)

const session    = ref<AdvisingSession | null>(null)
const curriculum = ref<CurriculumStatus | null>(null)
const errorMsg   = ref('')
const okMsg      = ref('')
const savingItem = ref<number | null>(null)
const addingSubject   = ref<number | null>(null)
const removingSubject = ref<number | null>(null)
const selectedAssignment = reactive<Record<number, number | null>>({})

interface ItemDecision {
    advisor_status: 'proposed' | 'accepted' | 'rejected' | 'replaced'
    replacement_subject_id: number | null
}
const decisions = reactive<Record<number, ItemDecision>>({})

interface OverrideModalState {
    entry: CurriculumStatusEntry
    assignmentId: number
    messages: string[]
}
const overrideModal = ref<OverrideModalState | null>(null)

const currentUserId = computed(() => {
    try {
        const u = JSON.parse(localStorage.getItem('user') ?? '{}')
        return u?.id ?? null
    } catch { return null }
})

const isMine    = computed(() => session.value?.reviewer?.id === currentUserId.value)
const canDecide = computed(() => session.value?.status === 'submitted' && isMine.value)

// Tarjeta del estudiante: foto + plan
const studentId    = computed<number | null>(() => session.value?.student?.id ?? session.value?.studentId ?? null)
const avatarFailed = ref(false)
const avatarUrl    = computed(() => studentId.value ? API.ADVISING_API.students.avatar(studentId.value) : '')
const planLabel    = computed(() => {
    const p = curriculum.value?.studyPlan
    if (!p) return '—'
    const name = p.careerName ?? p.name ?? 'Plan'
    return p.officialCode ? `${name} (${p.officialCode})` : name
})

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

/* ── Materias aperturadas para agregar ────────────────────────────── */
const proposedSubjectIds = computed(() => new Set((session.value?.items ?? []).map(i => i.subjectId)))
const repeatCount        = computed(() => curriculum.value?.repeatCount ?? 0)
const onlySpecials       = computed(() => repeatCount.value >= 2 && repeatCount.value <= 4)
const blockedByRepeats   = computed(() => repeatCount.value >= 5)
const showAllOffered     = computed(() => curriculum.value?.policy?.showOnlyEligible === false)
const targetSemester     = computed(() => {
    const cur = curriculum.value?.studentCurrentPeriodNumber
    return cur != null ? cur + 1 : null
})

/**
 * Mismo filtro que MyAdvisingPage: lo que el alumno vería en "Materias
 * Aperturadas" — pero excluyendo las que ya están propuestas (para no
 * duplicar). El asesor puede ver todo lo ofertado para decidir; las que
 * caen fuera de la regla (repites bloqueado, etc.) las puede agregar
 * vía override.
 */
const availableForAdd = computed<CurriculumStatusEntry[]>(() => {
    const tgt = targetSemester.value
    const subs = (curriculum.value?.subjects ?? []).filter(s => {
        if (!s.isOffered) return false
        if (s.attempt === 'aprobada') return false
        if (proposedSubjectIds.value.has(s.subjectId)) return false
        // Para el asesor mostramos TODAS las ofertadas; las reglas se aplican
        // en el momento de agregar (con posibilidad de override).
        return true
    })
    return subs.sort((a, b) =>
        (a.period ?? 0) - (b.period ?? 0) ||
        (a.subject?.name ?? '').localeCompare(b.subject?.name ?? '')
    )
})

/* ── Cargas ────────────────────────────────────────────────────────── */
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
        const studentId = session.value?.student?.id ?? session.value?.studentId
        const periodId  = session.value?.collegeAcademicPeriodId
        if (studentId) {
            api.get(API.ADVISING_API.students.curriculum(studentId), {
                params: periodId ? { college_academic_period_id: periodId } : {},
            }).then(r => { curriculum.value = r.data })
              .catch(() => { /* informativo */ })
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

async function addItem(entry: CurriculumStatusEntry, assignmentId: number, override = false) {
    if (!canDecide.value) return
    addingSubject.value = entry.subjectId
    errorMsg.value = ''
    try {
        await api.post(API.ADVISING_API.sessions.upsertSingleItem(sessionId), {
            subject_id:            entry.subjectId,
            curriculum_id:         entry.curriculumId,
            target_semester:       entry.period,
            teacher_assignment_id: assignmentId,
            override,
        })
        selectedAssignment[entry.subjectId] = null
        overrideModal.value = null
        okMsg.value = override ? 'Materia agregada con excepción.' : 'Materia agregada.'
        setTimeout(() => okMsg.value = '', 2000)
        await load()
    } catch (e: any) {
        const messages = extractOverridableMessages(e)
        if (messages.length > 0) {
            // Disparar modal de excepción
            overrideModal.value = { entry, assignmentId, messages }
        } else {
            errorMsg.value = e?.response?.data?.message ?? 'No se pudo agregar la materia.'
        }
    } finally {
        addingSubject.value = null
    }
}

function confirmOverride() {
    if (!overrideModal.value) return
    addItem(overrideModal.value.entry, overrideModal.value.assignmentId, true)
}

async function removeItem(subjectId: number) {
    if (!canDecide.value) return
    if (!confirm('¿Quitar esta materia de la sesión?')) return
    removingSubject.value = subjectId
    errorMsg.value = ''
    try {
        await api.delete(API.ADVISING_API.sessions.removeSingleItem(sessionId), {
            data: { subject_id: subjectId },
        })
        okMsg.value = 'Materia quitada.'
        setTimeout(() => okMsg.value = '', 1500)
        await load()
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message ?? 'No se pudo quitar.'
    } finally {
        removingSubject.value = null
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

/* ── Helpers ──────────────────────────────────────────────────────── */
const OVERRIDABLE_CODES = new Set(['over_max_credits', 'too_many_repeats', 'repeats_only_specials', 'schedule_conflict'])

function extractOverridableMessages(e: any): string[] {
    const ctx = e?.response?.data?.context ?? {}
    const out: string[] = []

    // Schedule conflicts
    if (Array.isArray(ctx.conflicts) && ctx.conflicts.length) {
        for (const c of ctx.conflicts) {
            const ms = (c?.itemA?.subject?.name && c?.itemB?.subject?.name)
                ? `Choque de horario entre ${c.itemA.subject.name} y ${c.itemB.subject.name}`
                : 'Choque de horario detectado.'
            out.push(ms)
        }
    }

    // Policy violations
    if (Array.isArray(ctx.violations)) {
        for (const v of ctx.violations) {
            if (OVERRIDABLE_CODES.has(v.code)) out.push(v.message)
        }
    }

    return out
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
function attemptLabelByEntry(e: CurriculumStatusEntry): string {
    if (e.attempt === 'especial') return 'ESPECIAL'
    if (e.attempt === 'repite')   return 'REPITE'
    return 'NORMAL'
}
function attemptColorByEntry(e: CurriculumStatusEntry): string {
    if (e.attempt === 'especial') return 'bg-red-100 text-red-700'
    if (e.attempt === 'repite')   return 'bg-orange-100 text-orange-700'
    return 'bg-slate-100 text-slate-600'
}
</script>
