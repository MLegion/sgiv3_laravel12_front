<template>
    <div class="space-y-4 max-w-6xl">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mi Asesoría</h1>
            <span v-if="session" class="px-3 py-1 text-xs font-semibold rounded-full" :class="statusClass(session.status)">
                {{ statusLabel(session.status) }}
            </span>
        </div>

        <!-- Selector de periodo / inicializar sesión -->
        <div v-if="!session" class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <FormRemoteSelect
                label="PERIODO OBJETIVO"
                v-model="periodId"
                :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.byId"
                :item-label="(cap: any) => cap.academicPeriod?.name || 'Periodo #' + cap.id"
                item-value="id"
                required
            />
            <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    :disabled="!periodId || loadingInit"
                    @click="ensureSession">
                {{ loadingInit ? 'Cargando…' : 'INICIAR ASESORÍA' }}
            </button>
        </div>

        <div v-if="errorMsg" class="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
            {{ errorMsg }}
        </div>
        <div v-if="okMsg" class="text-sm px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            {{ okMsg }}
        </div>

        <!-- Violaciones (errores de policy/conflicts) -->
        <div v-if="violations.length" class="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
            <h3 class="text-xs font-bold text-amber-700 uppercase mb-2">Reglas a corregir</h3>
            <ul class="text-sm text-amber-700 list-disc list-inside space-y-0.5">
                <li v-for="v in violations" :key="v.code + (v.subject_id ?? '') + (v.item_id ?? '')">
                    {{ v.message }}
                </li>
            </ul>
        </div>

        <!-- Retícula + carrito -->
        <div v-if="session" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Retícula (2/3) -->
            <div class="lg:col-span-2 bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3 flex items-center justify-between">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Retícula</h2>
                    <span class="text-xs text-slate-400">{{ curriculum?.studyPlan?.name ?? '—' }}</span>
                </div>
                <div v-if="loadingCurriculum" class="px-4 py-12 text-center text-xs text-slate-400">Cargando retícula…</div>
                <div v-else class="overflow-x-auto p-3">
                    <div class="grid auto-cols-[180px] grid-flow-col gap-2">
                        <div v-for="(group, level) in groupedByLevel" :key="level" class="flex flex-col gap-2">
                            <div class="text-[10px] font-black text-slate-400 uppercase text-center border-b pb-1">
                                Sem. {{ level }}
                            </div>
                            <div v-for="entry in group" :key="entry.curriculumId"
                                 class="border rounded-md p-2 text-[11px] cursor-pointer transition"
                                 :class="curriculumCardClass(entry)"
                                 @click="toggleSubject(entry)">
                                <div class="font-bold text-slate-700 line-clamp-2">{{ entry.subject?.name ?? '—' }}</div>
                                <div class="text-[9px] text-slate-400 font-mono mt-0.5">
                                    {{ entry.subject?.code ?? '' }} · {{ entry.subject?.credits ?? 0 }} cr.
                                </div>
                                <div class="mt-1">
                                    <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold" :class="attemptBadge(entry.attempt)">
                                        {{ attemptLabel(entry.attempt) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Carrito (1/3) -->
            <div class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3 flex items-center justify-between">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Mi carga propuesta</h2>
                    <span class="text-xs text-slate-400">{{ proposed.size }} mat. · {{ totalCredits }} cr.</span>
                </div>
                <div class="divide-y max-h-[480px] overflow-y-auto">
                    <div v-for="entry in proposedEntries" :key="entry.curriculumId"
                         class="px-4 py-2 flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700">{{ entry.subject?.name }}</span>
                            <span class="text-[10px] text-slate-400 font-mono">{{ entry.subject?.code }} · {{ entry.subject?.credits }} cr.</span>
                        </div>
                        <button v-if="canEdit"
                                class="text-[10px] text-red-500 hover:text-red-700"
                                @click="toggleSubject(entry)">QUITAR</button>
                    </div>
                    <div v-if="!proposed.size" class="px-4 py-6 text-center text-xs text-slate-400">
                        Selecciona materias en la retícula.
                    </div>
                </div>

                <div class="border-t p-4 space-y-2">
                    <textarea v-if="canEdit"
                              v-model="studentNotes"
                              placeholder="Notas para el asesor…"
                              rows="2"
                              class="w-full text-xs border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    <button v-if="canEdit"
                            :disabled="saving || !proposed.size"
                            class="w-full px-3 py-2 text-xs rounded-md border hover:bg-slate-50 disabled:opacity-50"
                            @click="saveDraft">
                        {{ saving ? 'Guardando…' : 'GUARDAR BORRADOR' }}
                    </button>
                    <button v-if="canEdit"
                            :disabled="submitting || !proposed.size"
                            class="w-full px-3 py-2 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            @click="submitForReview">
                        {{ submitting ? 'Enviando…' : 'ENVIAR PARA REVISIÓN' }}
                    </button>
                    <button v-if="session.status === 'rejected'"
                            class="w-full px-3 py-2 text-xs rounded-md border hover:bg-slate-50"
                            @click="reopen">REABRIR PARA EDITAR</button>
                </div>
            </div>
        </div>

        <!-- Resumen de razón de rechazo -->
        <div v-if="session?.rejectionReason" class="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 class="text-xs font-bold text-red-700 uppercase mb-1">Tu asesoría fue rechazada</h3>
            <p class="text-sm text-red-700">{{ session.rejectionReason }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import type {
    AdvisingSession, AdvisingStatus, CurriculumStatus, CurriculumStatusEntry,
    SubjectAttempt, PolicyViolation, ProposedItemInput,
} from '@/modules/advising/types/advising.type'

const periodId      = ref<number | null>(null)
const session       = ref<AdvisingSession | null>(null)
const curriculum    = ref<CurriculumStatus | null>(null)
const studentNotes  = ref('')
const errorMsg      = ref('')
const okMsg         = ref('')
const loadingInit   = ref(false)
const loadingCurriculum = ref(false)
const saving        = ref(false)
const submitting    = ref(false)
const violations    = ref<PolicyViolation[]>([])

/** subject_id => curriculumId del item ya en la sesión */
const proposed = reactive<Map<number, number>>(new Map())

const canEdit = computed(() =>
    session.value && (session.value.status === 'draft' || session.value.status === 'rejected'),
)

const groupedByLevel = computed(() => {
    const m = new Map<number, CurriculumStatusEntry[]>()
    for (const e of curriculum.value?.subjects ?? []) {
        const lvl = e.level ?? 0
        if (!m.has(lvl)) m.set(lvl, [])
        m.get(lvl)!.push(e)
    }
    return Object.fromEntries(Array.from(m.entries()).sort((a, b) => a[0] - b[0]))
})

const proposedEntries = computed<CurriculumStatusEntry[]>(() => {
    if (!curriculum.value) return []
    const ids = new Set(proposed.keys())
    return curriculum.value.subjects.filter(e => ids.has(e.subjectId))
})

const totalCredits = computed(() =>
    proposedEntries.value.reduce((acc, e) => acc + (e.subject?.credits ?? 0), 0),
)

async function ensureSession() {
    if (!periodId.value) return
    loadingInit.value = true
    errorMsg.value = ''
    try {
        const { data: cur } = await api.get(API.ADVISING_API.sessions.myCurrent, {
            params: { college_academic_period_id: periodId.value },
        })
        if (cur && cur.id) {
            session.value = cur
        } else {
            const created = await api.post(API.ADVISING_API.sessions.create, {
                college_academic_period_id: periodId.value,
            })
            session.value = created.data
        }
        await loadCurriculum()
        seedProposedFromSession()
    } catch (e: any) {
        errorMsg.value = extractMsg(e)
    } finally {
        loadingInit.value = false
    }
}

async function loadCurriculum() {
    if (!session.value) return
    loadingCurriculum.value = true
    try {
        const { data } = await api.get(API.ADVISING_API.students.curriculum(session.value.studentId))
        curriculum.value = data
    } finally {
        loadingCurriculum.value = false
    }
}

function seedProposedFromSession() {
    proposed.clear()
    for (const it of session.value?.items ?? []) {
        proposed.set(it.subjectId, it.curriculumId ?? 0)
    }
    studentNotes.value = session.value?.studentNotes ?? ''
}

function toggleSubject(entry: CurriculumStatusEntry) {
    if (!canEdit.value) return
    if (entry.attempt === 'aprobada') {
        errorMsg.value = `Ya tienes aprobada ${entry.subject?.name}.`
        return
    }
    if (proposed.has(entry.subjectId)) {
        proposed.delete(entry.subjectId)
    } else {
        proposed.set(entry.subjectId, entry.curriculumId)
    }
}

async function saveDraft() {
    if (!session.value) return
    saving.value = true
    errorMsg.value = ''
    okMsg.value = ''
    violations.value = []
    try {
        const items: ProposedItemInput[] = Array.from(proposed.entries()).map(([subjectId, curriculumId]) => {
            const entry = curriculum.value?.subjects.find(s => s.subjectId === subjectId)
            return {
                subject_id:      subjectId,
                curriculum_id:   curriculumId || null,
                target_semester: entry?.level ?? null,
            }
        })
        await api.patch(API.ADVISING_API.sessions.updateItems(session.value.id), { items })
        okMsg.value = 'Borrador guardado.'
        setTimeout(() => okMsg.value = '', 2000)
    } catch (e: any) {
        violations.value = extractViolations(e)
        if (!violations.value.length) errorMsg.value = extractMsg(e)
    } finally {
        saving.value = false
    }
}

async function submitForReview() {
    if (!session.value) return
    if (!confirm('¿Enviar tu carga propuesta al asesor? Después del envío sólo podrás editar si el asesor la rechaza.')) return
    submitting.value = true
    errorMsg.value = ''
    okMsg.value = ''
    violations.value = []
    try {
        // Primero guarda items + notas, luego envía
        await saveDraft()
        if (violations.value.length) return
        await api.post(API.ADVISING_API.sessions.submit(session.value.id), {
            student_notes: studentNotes.value || null,
        })
        okMsg.value = 'Asesoría enviada para revisión.'
        const { data } = await api.get(API.ADVISING_API.sessions.byId(session.value.id))
        session.value = data
    } catch (e: any) {
        violations.value = extractViolations(e)
        if (!violations.value.length) errorMsg.value = extractMsg(e)
    } finally {
        submitting.value = false
    }
}

async function reopen() {
    if (!session.value) return
    if (!confirm('¿Reabrir tu asesoría? Volverá a borrador.')) return
    try {
        await api.post(API.ADVISING_API.sessions.reopen(session.value.id))
        const { data } = await api.get(API.ADVISING_API.sessions.byId(session.value.id))
        session.value = data
    } catch (e: any) {
        errorMsg.value = extractMsg(e)
    }
}

function extractViolations(e: any): PolicyViolation[] {
    const ctx = e?.response?.data?.context
    if (Array.isArray(ctx?.violations)) return ctx.violations
    if (Array.isArray(ctx?.conflicts))  return ctx.conflicts.map((c: any) => ({
        code: 'schedule_conflict',
        message: `Choque de horario: materias ${c.subject_a_id} y ${c.subject_b_id}`,
        severity: 'error',
    }))
    return []
}
function extractMsg(e: any): string {
    return e?.response?.data?.message ?? 'Error al procesar la solicitud.'
}

function curriculumCardClass(entry: CurriculumStatusEntry): string {
    if (entry.attempt === 'aprobada') return 'bg-emerald-50 border-emerald-300 cursor-not-allowed opacity-70'
    if (proposed.has(entry.subjectId)) return 'bg-blue-100 border-blue-400 ring-2 ring-blue-300'
    if (entry.attempt === 'especial')  return 'bg-red-50 border-red-300 hover:bg-red-100'
    if (entry.attempt === 'repite')    return 'bg-orange-50 border-orange-300 hover:bg-orange-100'
    return 'bg-white border-slate-200 hover:bg-slate-50'
}

function attemptLabel(a: SubjectAttempt): string {
    return ({ normal: 'NORMAL', repite: 'REPITE', especial: 'ESPECIAL', aprobada: 'APROBADA' } as Record<SubjectAttempt, string>)[a]
}
function attemptBadge(a: SubjectAttempt): string {
    return ({
        normal:   'bg-slate-100 text-slate-600',
        repite:   'bg-orange-100 text-orange-700',
        especial: 'bg-red-100 text-red-700',
        aprobada: 'bg-emerald-100 text-emerald-700',
    } as Record<SubjectAttempt, string>)[a]
}
function statusLabel(s: AdvisingStatus): string {
    return ({ draft: 'BORRADOR', submitted: 'ENVIADA', approved: 'APROBADA', rejected: 'RECHAZADA', cancelled: 'CANCELADA' } as Record<AdvisingStatus, string>)[s]
}
function statusClass(s: AdvisingStatus): string {
    return ({
        draft:     'bg-slate-100 text-slate-600',
        submitted: 'bg-blue-100 text-blue-700',
        approved:  'bg-emerald-100 text-emerald-700',
        rejected:  'bg-red-100 text-red-700',
        cancelled: 'bg-slate-200 text-slate-500',
    } as Record<AdvisingStatus, string>)[s]
}

onMounted(() => {
    // Si el alumno regresa y ya tenía periodo seleccionado, podríamos persistirlo.
    // Por ahora exige seleccionar periodo cada vez.
})
</script>
