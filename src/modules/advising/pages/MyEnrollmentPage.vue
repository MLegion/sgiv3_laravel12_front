<template>
    <div class="space-y-4 max-w-7xl">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mi Reinscripción</h1>
            <RouterLink
                :to="{ name: 'advising.my-advising' }"
                class="text-xs text-slate-600 hover:underline"
            >
                ← Volver a Mi Asesoría
            </RouterLink>
        </div>

        <!-- Estados de carga / sin contexto -->
        <div v-if="loading" class="bg-white border rounded-xl shadow-sm p-6 text-center text-sm text-slate-400">
            Cargando…
        </div>
        <div v-else-if="!activePeriod?.open" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            <strong class="block mb-1">No hay periodo abierto para asesoría.</strong>
            {{ activePeriod?.message ?? 'Vuelve cuando tu coordinación habilite la fase.' }}
        </div>
        <div v-else-if="!session" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            Aún no tienes asesoría para este periodo.
            <RouterLink :to="{ name: 'advising.my-advising' }" class="underline font-semibold">Crearla en Mi Asesoría →</RouterLink>
        </div>
        <div v-else-if="session.status !== 'approved'" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            Tu asesoría está en estado
            <strong>{{ statusLabel(session.status) }}</strong>.
            La reinscripción se habilita cuando tu asesor apruebe la carga.
            <RouterLink :to="{ name: 'advising.my-advising' }" class="underline font-semibold ml-2">Ver Mi Asesoría →</RouterLink>
        </div>

        <!-- Banderas -->
        <div v-if="errorMsg" class="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">{{ errorMsg }}</div>
        <div v-if="okMsg"    class="text-sm px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">{{ okMsg }}</div>
        <div v-if="violations.length" class="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
            <h3 class="text-xs font-bold text-amber-700 uppercase mb-2">Reglas a corregir</h3>
            <ul class="text-sm text-amber-700 list-disc list-inside space-y-0.5">
                <li v-for="v in violations" :key="v.code">{{ v.message }}</li>
            </ul>
        </div>

        <!-- Estado A: reinscripción confirmada -->
        <template v-if="session && session.status === 'approved' && enrollments.length > 0">
            <div class="bg-emerald-50 border border-emerald-300 rounded-xl p-6 flex items-start gap-4">
                <div class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8 text-emerald-600">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <div class="flex-1">
                    <h2 class="text-lg font-bold text-emerald-800 uppercase">Reinscripción confirmada</h2>
                    <p class="text-sm text-emerald-700 mt-0.5">
                        Estás inscrito en <strong>{{ enrollments.length }}</strong> materia{{ enrollments.length === 1 ? '' : 's' }} para este periodo.
                    </p>
                </div>
                <button
                    :disabled="generatingProof"
                    class="px-5 py-2.5 text-sm rounded-md bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 self-center"
                    @click="downloadEnrollmentProof"
                >
                    {{ generatingProof ? 'Generando…' : 'DESCARGAR COMPROBANTE' }}
                </button>
            </div>

            <div class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">Materias inscritas</h3>
                </div>
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th scope="col" class="px-4 py-2 text-left">MATERIA</th>
                            <th scope="col" class="px-4 py-2 text-left">GRUPO</th>
                            <th scope="col" class="px-4 py-2 text-left">DOCENTE</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="e in enrollments" :key="e.id">
                            <td class="px-4 py-2">
                                <div class="font-bold text-slate-700">{{ e.subject?.name ?? '—' }}</div>
                                <div class="text-[10px] font-mono text-slate-400">{{ e.subject?.official_code }}</div>
                            </td>
                            <td class="px-4 py-2 text-xs font-mono font-semibold text-slate-700">{{ e.group?.name ?? '—' }}</td>
                            <td class="px-4 py-2 text-xs text-slate-600">{{ e.teacher?.name ?? '— por asignar —' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>

        <!-- Estado intermedio: cargando enrollments -->
        <div v-else-if="session && session.status === 'approved' && loadingEnrollment"
             class="bg-white border rounded-xl shadow-sm p-6 text-center text-sm text-slate-400">
            Cargando información de reinscripción…
        </div>

        <!-- Estado B: aprobado pero sin reinscripción confirmada -->
        <template v-else-if="session && session.status === 'approved'">
            <div v-if="eligibility" class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3 flex items-center justify-between gap-2">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">Requisitos para reinscripción</h3>
                    <span v-if="eligibility.allowed" class="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Listo para confirmar
                    </span>
                    <span v-else class="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Faltan requisitos
                    </span>
                </div>
                <ul class="divide-y">
                    <li v-for="g in eligibility.gates" :key="g.code" class="px-4 py-3 flex items-start gap-3">
                        <span class="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0" :class="gateBadgeClass(g.status)">
                            <svg v-if="g.status === 'pass'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                            </svg>
                            <svg v-else-if="g.status === 'fail'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            <span v-else class="text-xs font-bold">—</span>
                        </span>
                        <div class="flex-1">
                            <div class="text-sm font-semibold text-slate-700 uppercase">{{ g.title }}</div>
                            <div class="text-xs text-slate-500 mt-0.5">{{ g.message }}</div>

                            <!-- Sub-requisitos (p. ej. residencia): botón de excepción a la izquierda -->
                            <ul v-if="gateChecks(g).length" class="mt-2.5 space-y-1.5">
                                <li v-for="c in gateChecks(g)" :key="c.code" class="flex items-start gap-2.5">
                                    <div class="flex-shrink-0 w-[150px]">
                                        <ExceptionControl
                                            :ok="c.ok" :waived="c.waived"
                                            :status="exceptionStatus(g.code, c.code)"
                                            @request="openExceptionModal(g.code, c.code, c.label)"
                                        />
                                    </div>
                                    <div class="min-w-0 pt-0.5">
                                        <span class="text-xs font-medium" :class="c.ok ? 'text-slate-600' : 'text-rose-700'">{{ c.label }}</span>
                                        <span class="text-[11px] text-slate-400"> · {{ c.detail }}</span>
                                    </div>
                                </li>
                            </ul>

                            <!-- Gate sin sub-checks pero no cumplido: excepción a nivel de requisito -->
                            <div v-else-if="g.status === 'fail'" class="mt-2">
                                <ExceptionControl
                                    :ok="false" :waived="false"
                                    :status="exceptionStatus(g.code, g.code)"
                                    @request="openExceptionModal(g.code, g.code, g.title)"
                                />
                            </div>
                        </div>
                    </li>
                </ul>
                <div class="border-t px-4 py-3 flex justify-end">
                    <button
                        :disabled="!eligibility.allowed || confirmingEnrollment"
                        class="px-5 py-2 text-sm rounded-md font-bold text-white disabled:opacity-50"
                        :class="eligibility.allowed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'"
                        @click="confirmEnrollmentModalOpen = true"
                    >
                        {{ confirmingEnrollment ? 'Confirmando…' : 'CONFIRMAR REINSCRIPCIÓN' }}
                    </button>
                </div>
            </div>

            <!-- Resumen de la carga aprobada (referencia) -->
            <div class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">Carga aprobada (referencia)</h3>
                    <div class="text-xs text-slate-500">
                        <span class="text-2xl font-bold text-slate-800 tabular-nums">{{ session.items.length }}</span>
                        <span class="ml-1 text-[10px] uppercase">materias</span>
                    </div>
                </div>
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th scope="col" class="px-4 py-2 text-left">MATERIA</th>
                            <th scope="col" class="px-4 py-2 text-left">GRUPO / TURNO</th>
                            <th scope="col" class="px-4 py-2 text-left">DOCENTE</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="item in session.items" :key="item.id">
                            <td class="px-4 py-2">
                                <div class="font-bold text-slate-700">{{ item.subject?.name ?? '—' }}</div>
                                <div class="text-[10px] font-mono text-slate-400">{{ item.subject?.code }}</div>
                            </td>
                            <td class="px-4 py-2 text-xs">
                                <span class="font-mono font-semibold text-slate-700">{{ item.teacherAssignment?.groupName ?? '—' }}</span>
                            </td>
                            <td class="px-4 py-2 text-xs text-slate-600">
                                {{ item.teacherAssignment?.teacherName ?? '— por asignar —' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>

        <ConfirmModal
            v-model="confirmEnrollmentModalOpen"
            title="Confirmar reinscripción"
            message="Una vez confirmada, quedarás inscrito en las materias y grupos aprobados por tu asesor. Cualquier cambio posterior tendrá que hacerse en la fase de Altas y Bajas."
            confirm-text="Confirmar reinscripción"
            @confirm="confirmEnrollment"
        />

        <FormatUnavailableModal
            v-model="formatUnavailableOpen"
            :code="formatUnavailableInfo.code"
            :reason="formatUnavailableInfo.reason"
        />

        <!-- Modal: solicitar excepción al jefe de carrera -->
        <Teleport to="body">
            <div v-if="exceptionModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/40" @click="exceptionModal.open = false" />
                <div class="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 z-10">
                    <h3 class="text-sm font-bold text-slate-800 uppercase">Pedir excepción al jefe de carrera</h3>
                    <p class="text-sm text-slate-600">
                        Solicitarás una excepción al requisito
                        <strong class="text-slate-800">{{ exceptionModal.requirementLabel }}</strong>.
                        El jefe de carrera la revisará; si la aprueba, podrás continuar con tu reinscripción.
                    </p>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500 uppercase">Motivo (opcional)</span>
                        <textarea v-model="exceptionModal.note" rows="3"
                            class="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                            placeholder="Explica por qué solicitas la excepción…"></textarea>
                    </label>
                    <p v-if="exceptionModal.error" class="text-xs text-red-600">{{ exceptionModal.error }}</p>
                    <div class="flex justify-end gap-2 pt-1">
                        <button type="button" class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50"
                                :disabled="exceptionModal.submitting" @click="exceptionModal.open = false">
                            Cancelar
                        </button>
                        <button type="button"
                                class="px-4 py-2 text-sm rounded-lg text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                                :disabled="exceptionModal.submitting" @click="submitException">
                            {{ exceptionModal.submitting ? 'Enviando…' : 'Enviar solicitud' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'
import FormatUnavailableModal from '@/modules/reports/components/FormatUnavailableModal.vue'
import ExceptionControl from '@/modules/advising/components/ExceptionControl.vue'
import { useReportGenerator, ReportFormatUnavailableError } from '@/modules/reports/composables/useReportGenerator'
import { ReportCode } from '@/modules/reports/types/reportCodes'
import type {
    AdvisingSession, AdvisingStatus,
    EnrollmentEligibilityReport, EnrolledCourse, EnrollmentConfirmResponse, GateStatus, PolicyViolation,
    EnrollmentGateResult, RequirementCheck, MyRequirementException, RequirementExceptionStatus,
} from '@/modules/advising/types/advising.type'

interface ActivePeriod {
    open: boolean
    message?: string
    collegeAcademicPeriodId?: number
}

const activePeriod  = ref<ActivePeriod | null>(null)
const session       = ref<AdvisingSession | null>(null)
const loading       = ref(true)
const errorMsg      = ref('')
const okMsg         = ref('')
const violations    = ref<PolicyViolation[]>([])

const enrollments              = ref<EnrolledCourse[]>([])
const eligibility              = ref<EnrollmentEligibilityReport | null>(null)
const loadingEnrollment        = ref(false)
const confirmingEnrollment     = ref(false)
const generatingProof          = ref(false)
const confirmEnrollmentModalOpen = ref(false)

const formatUnavailableOpen = ref(false)
const formatUnavailableInfo = ref<{ code: string; reason: 'missing' | 'inactive' }>({ code: '', reason: 'missing' })

// Excepciones a requisitos (solicitar al jefe de carrera)
const myExceptions = ref<MyRequirementException[]>([])
const exceptionModal = reactive<{
    open: boolean; gateCode: string; requirementCode: string; requirementLabel: string;
    note: string; submitting: boolean; error: string
}>({ open: false, gateCode: '', requirementCode: '', requirementLabel: '', note: '', submitting: false, error: '' })

const { generatePdf } = useReportGenerator()

/** Sub-requisitos de un gate (p. ej. residencia trae checks en meta). */
function gateChecks(g: EnrollmentGateResult): RequirementCheck[] {
    const checks = (g.meta as any)?.checks
    return Array.isArray(checks) ? checks as RequirementCheck[] : []
}

/** Estado de la excepción para un requisito, o null si no se ha solicitado. */
function exceptionStatus(gateCode: string, requirementCode: string): RequirementExceptionStatus | null {
    const e = myExceptions.value.find(x => x.gateCode === gateCode && x.requirementCode === requirementCode)
    return e ? e.status : null
}

function openExceptionModal(gateCode: string, requirementCode: string, requirementLabel: string) {
    exceptionModal.open = true
    exceptionModal.gateCode = gateCode
    exceptionModal.requirementCode = requirementCode
    exceptionModal.requirementLabel = requirementLabel
    exceptionModal.note = ''
    exceptionModal.error = ''
}

async function submitException() {
    const periodId = activePeriod.value?.collegeAcademicPeriodId
    if (!periodId || exceptionModal.submitting) return
    exceptionModal.submitting = true
    exceptionModal.error = ''
    try {
        await api.post(API.ADVISING_API.requirementExceptions.request, {
            college_academic_period_id: periodId,
            gate_code:                  exceptionModal.gateCode,
            requirement_code:           exceptionModal.requirementCode,
            requirement_label:          exceptionModal.requirementLabel,
            note:                       exceptionModal.note || null,
        })
        exceptionModal.open = false
        okMsg.value = 'Solicitud enviada al jefe de carrera.'
        setTimeout(() => okMsg.value = '', 4000)
        await loadMyExceptions(periodId)
    } catch (e: any) {
        exceptionModal.error = extractMsg(e)
    } finally {
        exceptionModal.submitting = false
    }
}

async function loadMyExceptions(periodId: number) {
    try {
        const { data } = await api.get(API.ADVISING_API.requirementExceptions.mine, {
            params: { college_academic_period_id: periodId },
        })
        myExceptions.value = Array.isArray(data?.data) ? data.data : []
    } catch {
        myExceptions.value = []
    }
}

function gateBadgeClass(status: GateStatus): string {
    return ({
        pass: 'bg-emerald-100 text-emerald-700',
        fail: 'bg-rose-100 text-rose-700',
        skip: 'bg-slate-100 text-slate-400',
    } as Record<GateStatus, string>)[status]
}

function statusLabel(s: AdvisingStatus): string {
    return ({ draft: 'BORRADOR', submitted: 'ENVIADA', approved: 'APROBADA', rejected: 'RECHAZADA', cancelled: 'CANCELADA' } as Record<AdvisingStatus, string>)[s]
}

function extractMsg(e: any): string {
    return e?.response?.data?.message ?? 'Error al procesar la solicitud.'
}

async function loadAll() {
    loading.value = true
    try {
        const { data: ap } = await api.get(API.ADVISING_API.sessions.myActivePeriod)
        activePeriod.value = ap
        if (!ap?.open || !ap.collegeAcademicPeriodId) return

        const { data: cur } = await api.get(API.ADVISING_API.sessions.myCurrent, {
            params: { college_academic_period_id: ap.collegeAcademicPeriodId },
        })
        if (cur && cur.id) session.value = cur

        if (session.value?.status === 'approved') {
            await loadEnrollmentsAndEligibility()
        }
    } catch (e: any) {
        errorMsg.value = extractMsg(e)
    } finally {
        loading.value = false
    }
}

async function loadEnrollmentsAndEligibility() {
    if (!session.value || session.value.status !== 'approved') return
    const periodId = activePeriod.value?.collegeAcademicPeriodId
    if (!periodId) return

    loadingEnrollment.value = true
    try {
        const { data: enrollmentResp } = await api.get(API.ADVISING_API.enrollments.me, {
            params: { college_academic_period_id: periodId },
        })
        enrollments.value = Array.isArray(enrollmentResp?.data) ? enrollmentResp.data : []

        if (enrollments.value.length === 0) {
            const { data: report } = await api.get(API.ADVISING_API.enrollments.eligibility, {
                params: {
                    college_academic_period_id: periodId,
                    advising_session_id:        session.value.id,
                },
            })
            eligibility.value = report ?? null
            await loadMyExceptions(periodId)
        } else {
            eligibility.value = null
        }
    } catch (e: any) {
        errorMsg.value = extractMsg(e)
    } finally {
        loadingEnrollment.value = false
    }
}

async function confirmEnrollment() {
    if (!session.value || confirmingEnrollment.value) return
    const periodId = activePeriod.value?.collegeAcademicPeriodId
    if (!periodId) return

    confirmingEnrollment.value = true
    errorMsg.value = ''
    violations.value = []
    try {
        const { data } = await api.post<EnrollmentConfirmResponse>(API.ADVISING_API.enrollments.confirm, {
            college_academic_period_id: periodId,
            advising_session_id:        session.value.id,
        })
        confirmEnrollmentModalOpen.value = false
        okMsg.value = data.created
            ? `Reinscripción confirmada: ${data.count} materia${data.count === 1 ? '' : 's'}.`
            : 'Tu reinscripción ya estaba registrada.'
        setTimeout(() => okMsg.value = '', 4000)
        await loadEnrollmentsAndEligibility()
    } catch (e: any) {
        const v = e?.response?.data?.violations
        if (Array.isArray(v) && v.length) violations.value = v
        errorMsg.value = extractMsg(e)
        confirmEnrollmentModalOpen.value = false
    } finally {
        confirmingEnrollment.value = false
    }
}

async function downloadEnrollmentProof() {
    if (!session.value || generatingProof.value) return
    const periodId = activePeriod.value?.collegeAcademicPeriodId
    if (!periodId) return

    generatingProof.value = true
    errorMsg.value = ''
    try {
        const { blob } = await generatePdf({
            reportCode: ReportCode.ENROLLMENT_PROOF,
            params: {
                student_id:                 session.value.studentId,
                college_academic_period_id: periodId,
            },
        })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
    } catch (e: any) {
        if (e instanceof ReportFormatUnavailableError) {
            formatUnavailableInfo.value = { code: e.code, reason: e.reason }
            formatUnavailableOpen.value = true
        } else {
            errorMsg.value = e?.message ?? 'No se pudo generar el comprobante.'
        }
    } finally {
        generatingProof.value = false
    }
}

onMounted(loadAll)
</script>
