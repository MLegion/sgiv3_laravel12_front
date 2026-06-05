<template>
    <div class="space-y-4 max-w-7xl">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis Altas y Bajas</h1>
            <RouterLink :to="{ name: 'advising.my-enrollment' }" class="text-xs text-slate-600 hover:underline">
                ← Volver a Mi Reinscripción
            </RouterLink>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl shadow-sm p-6 text-center text-sm text-slate-400">
            Cargando…
        </div>

        <!-- Fase cerrada -->
        <div v-else-if="!activePeriod?.open" class="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center">
            <div class="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <h2 class="text-lg font-bold text-slate-700 uppercase">Fase no disponible</h2>
            <p class="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                {{ activePeriod?.message ?? 'La fase de Altas y Bajas no está abierta en este momento.' }}
            </p>
        </div>

        <template v-else>
            <!-- Banderas -->
            <div v-if="errorMsg" class="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">{{ errorMsg }}</div>
            <div v-if="okMsg"    class="text-sm px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">{{ okMsg }}</div>
            <div v-if="violations.length" class="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
                <h3 class="text-xs font-bold text-amber-700 uppercase mb-2">No se pudo procesar</h3>
                <ul class="text-sm text-amber-700 list-disc list-inside space-y-0.5">
                    <li v-for="(v, i) in violations" :key="i">{{ v.message }}</li>
                </ul>
            </div>

            <!-- Estado de la solicitud -->
            <div v-if="request" class="bg-white border rounded-xl shadow-sm px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-600 uppercase">Solicitud #{{ request.id }}</span>
                    <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full" :class="statusClass(request.status)">
                        {{ statusLabel(request.status) }}
                    </span>
                </div>
                <p v-if="request.status === 'rejected' && request.rejectionReason" class="text-xs text-red-600">
                    Motivo de rechazo: {{ request.rejectionReason }}
                </p>
                <p v-else-if="request.status === 'submitted'" class="text-xs text-blue-600">
                    Enviada. Esperando la revisión del jefe de carrera.
                </p>
            </div>

            <!-- Mi carga actual -->
            <div class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">Mi carga actual</h3>
                </div>
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th class="px-4 py-2 text-left">MATERIA</th>
                            <th class="px-4 py-2 text-left">GRUPO</th>
                            <th class="px-4 py-2 text-left">DOCENTE</th>
                            <th class="px-4 py-2 text-right">ACCIÓN</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="e in currentLoad" :key="e.id" :class="isDropped(e.id) ? 'bg-red-50' : ''">
                            <td class="px-4 py-2">
                                <div class="font-bold text-slate-700" :class="isDropped(e.id) ? 'line-through text-red-400' : ''">
                                    {{ e.subject?.name ?? '—' }}
                                </div>
                                <div class="text-[10px] font-mono text-slate-400">{{ e.subject?.official_code }}</div>
                            </td>
                            <td class="px-4 py-2 text-xs font-mono font-semibold text-slate-700">{{ e.group?.name ?? '—' }}</td>
                            <td class="px-4 py-2 text-xs text-slate-600">{{ e.teacher?.name ?? '— por asignar —' }}</td>
                            <td class="px-4 py-2 text-right">
                                <button v-if="isDropped(e.id)" type="button"
                                    :disabled="!editable || busy"
                                    class="px-3 py-1 text-xs rounded-md border text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                    @click="removeItem('drop', e.subject!.id)">
                                    Deshacer baja
                                </button>
                                <button v-else type="button"
                                    :disabled="!editable || busy"
                                    class="px-3 py-1 text-xs rounded-md border text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-40"
                                    @click="dropEnrollment(e.id)">
                                    Dar de baja
                                </button>
                            </td>
                        </tr>
                        <tr v-if="!currentLoad.length">
                            <td colspan="4" class="px-4 py-6 text-center text-sm text-slate-400">No tienes materias inscritas.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Altas propuestas -->
            <div v-if="addedItems.length" class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3">
                    <h3 class="text-sm font-bold text-emerald-700 uppercase">Altas solicitadas</h3>
                </div>
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th class="px-4 py-2 text-left">MATERIA</th>
                            <th class="px-4 py-2 text-left">GRUPO</th>
                            <th class="px-4 py-2 text-left">DOCENTE</th>
                            <th class="px-4 py-2 text-right">ACCIÓN</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="it in addedItems" :key="it.id" class="bg-emerald-50/40">
                            <td class="px-4 py-2 font-bold text-slate-700">{{ it.subject?.name ?? '—' }}</td>
                            <td class="px-4 py-2 text-xs font-mono">{{ it.teacherAssignment?.groupName ?? '—' }}</td>
                            <td class="px-4 py-2 text-xs text-slate-600">{{ it.teacherAssignment?.teacherName ?? '—' }}</td>
                            <td class="px-4 py-2 text-right">
                                <button type="button" :disabled="!editable || busy"
                                    class="px-3 py-1 text-xs rounded-md border text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                    @click="removeItem('add', it.subjectId)">
                                    Quitar
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Agregar materia -->
            <div v-if="editable" class="bg-white border rounded-xl shadow-sm p-4 space-y-3">
                <h3 class="text-sm font-bold text-slate-700 uppercase">Agregar materia</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <label class="block">
                        <span class="text-[10px] font-bold text-slate-400 uppercase">Materia ofertada</span>
                        <select v-model="addForm.subjectId" class="mt-1 w-full border rounded-md px-2 py-2 text-sm"
                            @change="addForm.teacherAssignmentId = null">
                            <option :value="null">— Selecciona —</option>
                            <option v-for="s in addableSubjects" :key="s.subjectId" :value="s.subjectId">
                                {{ s.subject?.name }} ({{ s.subject?.credits ?? 0 }} cr)
                            </option>
                        </select>
                    </label>
                    <label class="block">
                        <span class="text-[10px] font-bold text-slate-400 uppercase">Grupo</span>
                        <select v-model="addForm.teacherAssignmentId" class="mt-1 w-full border rounded-md px-2 py-2 text-sm"
                            :disabled="!selectedSubject">
                            <option :value="null">— Selecciona —</option>
                            <option v-for="a in selectedSubject?.offer?.assignments ?? []" :key="a.id" :value="a.id">
                                {{ a.groupName }} · {{ a.teacherName ?? 'sin docente' }}
                            </option>
                        </select>
                    </label>
                    <button type="button"
                        :disabled="busy || !addForm.subjectId || !addForm.teacherAssignmentId"
                        class="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-40"
                        @click="addSubject">
                        Agregar
                    </button>
                </div>
                <p v-if="!addableSubjects.length" class="text-xs text-slate-400">
                    No hay materias ofertadas disponibles para agregar.
                </p>
            </div>

            <!-- Acciones -->
            <div class="flex justify-end gap-2">
                <button v-if="request && (request.status === 'draft' || request.status === 'submitted' || request.status === 'rejected')"
                    type="button" :disabled="busy"
                    class="px-4 py-2 text-sm rounded-md border text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    @click="cancelRequest">
                    Cancelar solicitud
                </button>
                <button v-if="editable" type="button"
                    :disabled="busy || !hasItems"
                    class="px-5 py-2 text-sm rounded-md bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-40"
                    @click="submitRequest">
                    {{ busy ? 'Enviando…' : 'Enviar solicitud' }}
                </button>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type {
    AddDropActivePeriod, AddDropRequest, AddDropItemType,
    CurriculumStatus, CurriculumStatusEntry, EnrolledCourse, PolicyViolation, AdvisingStatus,
} from '@/modules/advising/types/advising.type'

const loading = ref(true)
const busy    = ref(false)
const errorMsg   = ref('')
const okMsg      = ref('')
const violations = ref<PolicyViolation[]>([])

const activePeriod = ref<AddDropActivePeriod | null>(null)
const studentId    = ref<number | null>(null)
const request      = ref<AddDropRequest | null>(null)
const currentLoad  = ref<EnrolledCourse[]>([])
const curriculum   = ref<CurriculumStatus | null>(null)

const addForm = reactive<{ subjectId: number | null; teacherAssignmentId: number | null }>({
    subjectId: null,
    teacherAssignmentId: null,
})

const editable = computed(() =>
    request.value === null || request.value.status === 'draft' || request.value.status === 'rejected',
)

const droppedEnrollmentIds = computed<number[]>(() =>
    (request.value?.items ?? [])
        .filter(i => i.type === 'drop' && i.sourceEnrollmentId !== null)
        .map(i => i.sourceEnrollmentId as number),
)
const addedItems = computed(() => (request.value?.items ?? []).filter(i => i.type === 'add'))
const hasItems   = computed(() => (request.value?.items?.length ?? 0) > 0)

const currentSubjectIds = computed(() => new Set(currentLoad.value.map(e => e.subject?.id).filter(Boolean) as number[]))
const addedSubjectIds   = computed(() => new Set(addedItems.value.map(i => i.subjectId)))

const addableSubjects = computed<CurriculumStatusEntry[]>(() =>
    (curriculum.value?.subjects ?? []).filter(s =>
        s.isOffered
        && s.countsForStudent
        && !(s.kardex?.passed ?? false)
        && !currentSubjectIds.value.has(s.subjectId)
        && !addedSubjectIds.value.has(s.subjectId)
        && (s.offer?.assignments?.length ?? 0) > 0,
    ),
)
const selectedSubject = computed<CurriculumStatusEntry | null>(() =>
    addableSubjects.value.find(s => s.subjectId === addForm.subjectId) ?? null,
)

function isDropped(enrollmentId: number): boolean {
    return droppedEnrollmentIds.value.includes(enrollmentId)
}

function periodId(): number | null {
    return activePeriod.value?.collegeAcademicPeriodId ?? null
}

function extractMsg(e: any): string {
    return e?.response?.data?.message ?? 'Error al procesar la solicitud.'
}

function handleError(e: any) {
    const v = e?.response?.data?.violations
    violations.value = Array.isArray(v) ? v : []
    errorMsg.value = extractMsg(e)
}

function clearFlags() {
    errorMsg.value = ''
    okMsg.value = ''
    violations.value = []
}

async function loadAll() {
    loading.value = true
    try {
        const { data: ap } = await api.get(API.ADVISING_API.addDrop.myActivePeriod)
        activePeriod.value = ap
        if (!ap?.open || !ap.collegeAcademicPeriodId) return
        await refresh()
    } catch (e: any) {
        errorMsg.value = extractMsg(e)
    } finally {
        loading.value = false
    }
}

async function refresh() {
    const pid = periodId()
    if (!pid) return
    const { data } = await api.get(API.ADVISING_API.addDrop.myCurrent, {
        params: { college_academic_period_id: pid },
    })
    studentId.value   = data.studentId ?? null
    request.value     = data.request ?? null
    currentLoad.value = Array.isArray(data.currentLoad) ? data.currentLoad : []

    if (studentId.value && curriculum.value === null) {
        try {
            const { data: cur } = await api.get(API.ADVISING_API.students.curriculum(studentId.value), {
                params: { college_academic_period_id: pid },
            })
            curriculum.value = cur ?? null
        } catch { /* el picker simplemente queda vacío */ }
    }
}

/** Devuelve el id de una solicitud editable, creándola si hace falta. */
async function ensureRequest(): Promise<number | null> {
    if (request.value && editable.value) return request.value.id
    const pid = periodId()
    if (!pid) return null
    const { data } = await api.post(API.ADVISING_API.addDrop.create, {
        college_academic_period_id: pid,
    })
    request.value = data ?? null
    return request.value?.id ?? null
}

async function dropEnrollment(enrollmentId: number) {
    if (busy.value) return
    busy.value = true
    clearFlags()
    try {
        const id = await ensureRequest()
        if (!id) return
        const { data } = await api.post(API.ADVISING_API.addDrop.dropItem(id), {
            source_enrollment_id: enrollmentId,
        })
        request.value = data ?? request.value
    } catch (e: any) {
        handleError(e)
    } finally {
        busy.value = false
    }
}

async function addSubject() {
    if (busy.value || !addForm.subjectId || !addForm.teacherAssignmentId) return
    busy.value = true
    clearFlags()
    try {
        const id = await ensureRequest()
        if (!id) return
        const subject = selectedSubject.value
        const { data } = await api.post(API.ADVISING_API.addDrop.addItem(id), {
            subject_id:            addForm.subjectId,
            curriculum_id:         subject?.curriculumId ?? null,
            teacher_assignment_id: addForm.teacherAssignmentId,
        })
        request.value = data ?? request.value
        addForm.subjectId = null
        addForm.teacherAssignmentId = null
    } catch (e: any) {
        handleError(e)
    } finally {
        busy.value = false
    }
}

async function removeItem(type: AddDropItemType, subjectId: number) {
    if (busy.value || !request.value) return
    busy.value = true
    clearFlags()
    try {
        const { data } = await api.delete(API.ADVISING_API.addDrop.removeItem(request.value.id), {
            data: { type, subject_id: subjectId },
        })
        request.value = data ?? request.value
    } catch (e: any) {
        handleError(e)
    } finally {
        busy.value = false
    }
}

async function submitRequest() {
    if (busy.value || !request.value) return
    busy.value = true
    clearFlags()
    try {
        const { data } = await api.post(API.ADVISING_API.addDrop.submit(request.value.id))
        request.value = data ?? request.value
        okMsg.value = request.value?.status === 'approved'
            ? 'Solicitud aprobada y aplicada.'
            : 'Solicitud enviada al jefe de carrera.'
        await refresh()
    } catch (e: any) {
        handleError(e)
    } finally {
        busy.value = false
    }
}

async function cancelRequest() {
    if (busy.value || !request.value) return
    busy.value = true
    clearFlags()
    try {
        await api.post(API.ADVISING_API.addDrop.cancel(request.value.id))
        request.value = null
        okMsg.value = 'Solicitud cancelada.'
        await refresh()
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

onMounted(loadAll)
</script>
