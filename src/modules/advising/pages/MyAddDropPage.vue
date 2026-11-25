<template>
    <div class="space-y-4 max-w-7xl">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis Altas y Bajas</h1>
            <RouterLink :to="{ name: 'advising.my-enrollment' }" class="text-xs text-slate-600 hover:underline">
                ← Volver a Mi Reinscripción
            </RouterLink>
        </div>

        <SkeletonText v-if="loading" :lines="3" class="bg-white border rounded-xl shadow-sm p-6" />

        <!-- Fase cerrada -->
        <PhaseUnavailable
            v-else-if="!activePeriod?.open"
            :message="loadError || activePeriod?.message || 'La fase de Altas y Bajas no está abierta en este momento.'"
            :hint="loadError ? '(No se pudo consultar la disponibilidad — revisa que estés dentro con tu usuario de alumno.)' : ''"
        />

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

            <!-- Historial de movimientos (altas y bajas realizadas) -->
            <div v-if="showHistory" class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3 flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">Historial de movimientos</h3>
                    <span class="text-[10px] text-slate-400 uppercase tracking-wide">Solicitud #{{ historySource?.id }}</span>
                </div>
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

            <!-- Mi carga actual -->
            <div class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3 flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">Mi carga actual</h3>
                    <div class="flex items-center gap-3 text-[10px] uppercase tracking-wide">
                        <span class="inline-flex items-center gap-1 text-slate-500"><span class="w-2.5 h-2.5 rounded-sm bg-slate-200"></span>Inscrita</span>
                        <span class="inline-flex items-center gap-1 text-red-600"><span class="w-2.5 h-2.5 rounded-sm bg-red-200"></span>Baja</span>
                        <span class="inline-flex items-center gap-1 text-emerald-600"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-200"></span>Alta</span>
                    </div>
                </div>
                <DataTable :columns="currentLoadColumns" :rows="currentLoad" hide-search caption="Mi carga actual" empty-text="No tienes materias inscritas."
                    :row-class="(row) => isDropped(row.id) ? 'bg-red-50/60' : ''">
                    <template #cell-estado="{ row }">
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                            :class="isDropped(row.id) ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'">
                            {{ isDropped(row.id) ? 'BAJA' : 'INSCRITA' }}
                        </span>
                    </template>
                    <template #cell-subject="{ row }">
                        <div class="font-bold text-slate-700" :class="isDropped(row.id) ? 'line-through text-red-600' : ''">
                            {{ row.subject?.name ?? '—' }}
                        </div>
                        <div class="text-[10px] font-mono text-slate-400">{{ row.subject?.official_code }}</div>
                    </template>
                    <template #cell-group="{ row }"><span class="text-xs font-mono font-semibold text-slate-700">{{ row.group?.name ?? '—' }}</span></template>
                    <template #cell-teacher="{ row }"><span class="text-xs text-slate-600">{{ row.teacher?.name ?? '— por asignar —' }}</span></template>
                    <template #cell-actions="{ row }">
                        <button v-if="isDropped(row.id)" type="button"
                            :disabled="!editable || busy"
                            class="px-3 py-1 text-xs rounded-md border text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                            @click="removeItem('drop', row.subject!.id)">
                            Deshacer baja
                        </button>
                        <button v-else type="button"
                            :disabled="!editable || busy"
                            class="px-3 py-1 text-xs rounded-md border text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-40"
                            @click="dropEnrollment(row.id)">
                            Dar de baja
                        </button>
                    </template>
                </DataTable>
            </div>

            <!-- Altas propuestas -->
            <div v-if="pendingAddedItems.length" class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3">
                    <h3 class="text-sm font-bold text-emerald-700 uppercase">Altas solicitadas</h3>
                </div>
                <DataTable :columns="pendingAddColumns" :rows="pendingAddedItems" hide-search caption="Altas solicitadas" empty-text="Sin altas."
                    :row-class="() => 'bg-emerald-50/60'">
                    <template #cell-estado>
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">ALTA</span>
                    </template>
                    <template #cell-subject="{ row }"><span class="font-bold text-slate-700">{{ row.subject?.name ?? '—' }}</span></template>
                    <template #cell-group="{ row }"><span class="text-xs font-mono">{{ row.teacherAssignment?.groupName ?? '—' }}</span></template>
                    <template #cell-teacher="{ row }"><span class="text-xs text-slate-600">{{ row.teacherAssignment?.teacherName ?? '—' }}</span></template>
                    <template #cell-actions="{ row }">
                        <button type="button" :disabled="!editable || busy"
                            class="px-3 py-1 text-xs rounded-md border text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                            @click="removeItem('add', row.subjectId)">
                            Quitar
                        </button>
                    </template>
                </DataTable>
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
import PhaseUnavailable from '@/app/components/ui/PhaseUnavailable.vue'
import SkeletonText from '@/app/components/ui/SkeletonText.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import type {
    AddDropActivePeriod, AddDropRequest, AddDropItemType,
    CurriculumStatus, CurriculumStatusEntry, EnrolledCourse, PolicyViolation, AdvisingStatus,
} from '@/modules/advising/types/advising.type'

type MovementRow = NonNullable<AddDropRequest['items']>[number]
const movementColumns: DataTableColumn<MovementRow>[] = [
    { key: 'movimiento', label: 'Movimiento', width: '7rem' },
    { key: 'subject', label: 'Materia' },
    { key: 'group', label: 'Grupo' },
    { key: 'teacher', label: 'Docente' },
    { key: 'estado', label: 'Estado', align: 'right', width: '7rem' },
]
const currentLoadColumns: DataTableColumn<EnrolledCourse>[] = [
    { key: 'estado', label: 'Estado', width: '7rem' },
    { key: 'subject', label: 'Materia' },
    { key: 'group', label: 'Grupo' },
    { key: 'teacher', label: 'Docente' },
    { key: 'actions', label: 'Acción', align: 'right' },
]
const pendingAddColumns: DataTableColumn<MovementRow>[] = [
    { key: 'estado', label: 'Estado', width: '7rem' },
    { key: 'subject', label: 'Materia' },
    { key: 'group', label: 'Grupo' },
    { key: 'teacher', label: 'Docente' },
    { key: 'actions', label: 'Acción', align: 'right' },
]

const loading = ref(true)
const busy    = ref(false)
const errorMsg   = ref('')
const okMsg      = ref('')
const violations = ref<PolicyViolation[]>([])

const activePeriod = ref<AddDropActivePeriod | null>(null)
const loadError    = ref('')
const studentId    = ref<number | null>(null)
const request      = ref<AddDropRequest | null>(null)
const historyReq   = ref<AddDropRequest | null>(null)
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
// Altas aún pendientes de aplicar: una vez aplicadas pasan a "Mi carga actual".
const pendingAddedItems = computed(() => addedItems.value.filter(i => !i.applied))
const hasItems   = computed(() => (request.value?.items?.length ?? 0) > 0)

// Historial: todos los movimientos de la última solicitud (altas y bajas),
// visible una vez enviada/aplicada para que el alumno conserve el registro aun
// cuando las bajas ya no aparezcan en la carga y las altas ya sean "inscritas".
// Usa `history` (cualquier estado, incluida la aprobada); si no, la viva.
const historySource = computed(() => historyReq.value ?? request.value)
const movements = computed(() => historySource.value?.items ?? [])
const showHistory = computed(() =>
    movements.value.length > 0 && !!historySource.value && historySource.value.status !== 'draft',
)

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
    loadError.value = ''
    try {
        const { data: ap } = await api.get(API.ADVISING_API.addDrop.myActivePeriod)
        activePeriod.value = ap
        if (!ap?.open || !ap.collegeAcademicPeriodId) return
        await refresh()
    } catch (e: any) {
        // Deja visible el motivo real en el bloque "Fase no disponible"
        // (p.ej. 404 "No estás vinculado a un alumno", 403, 500).
        loadError.value = extractMsg(e)
        errorMsg.value = loadError.value
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
    historyReq.value  = data.history ?? null
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
