<template>
    <div class="max-w-3xl mx-auto px-3 py-3 sm:px-4 sm:py-4 space-y-3 sm:space-y-4">
        <RouterLink :to="{ name: 'admissions.proctor.my-sessions' }" class="text-xs text-slate-500 hover:text-blue-600">
            ← Mis sesiones
        </RouterLink>

        <div v-if="!session" class="text-sm text-slate-400 italic">Cargando...</div>

        <div v-else class="space-y-3 sm:space-y-4">
            <!-- Cabecera -->
            <div class="bg-white border border-slate-200 rounded-lg p-3 sm:p-4">
                <div class="flex items-start justify-between flex-wrap gap-2">
                    <div class="min-w-0 flex-1">
                        <h1 class="text-base sm:text-lg font-semibold text-slate-800 uppercase truncate">
                            {{ session.place?.name ?? 'Aula —' }}
                        </h1>
                        <p class="text-xs sm:text-sm text-slate-600 mt-0.5">
                            {{ formatLongDate(session.date) }}
                        </p>
                        <p class="text-xs sm:text-sm text-slate-600 font-mono">
                            {{ session.startTime?.slice(0,5) }} – {{ session.endTime?.slice(0,5) }}
                        </p>
                    </div>
                    <span :class="statusClass(session.status)" class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap">
                        {{ statusLabel(session.status) }}
                    </span>
                </div>

                <!-- Banner pausa/suspensión -->
                <div
                    v-if="session.status === 'PAUSED' && session.pauseReason"
                    class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800"
                >
                    <div class="font-bold uppercase tracking-wide mb-0.5">⏸ Sesión pausada</div>
                    <div>{{ session.pauseReason }}</div>
                    <div v-if="session.pausedAt" class="text-[10px] text-amber-600 mt-1">{{ formatTime(session.pausedAt) }}</div>
                </div>
                <div
                    v-else-if="session.status === 'SUSPENDED' && session.suspendReason"
                    class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800"
                >
                    <div class="font-bold uppercase tracking-wide mb-0.5">⚠ Sesión suspendida por incidente</div>
                    <div>{{ session.suspendReason }}</div>
                    <div v-if="session.suspendedAt" class="text-[10px] text-red-600 mt-1">{{ formatTime(session.suspendedAt) }}</div>
                </div>

                <!-- Stats: 2 col en móvil, 4 en desktop -->
                <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div class="bg-slate-50 rounded p-2">
                        <div class="text-lg sm:text-base font-bold text-slate-700">{{ session.attendanceCounts.PENDING }}</div>
                        <div class="text-[10px] text-slate-400 uppercase">Pendientes</div>
                    </div>
                    <div class="bg-emerald-50 rounded p-2">
                        <div class="text-lg sm:text-base font-bold text-emerald-700">{{ session.attendanceCounts.PRESENT }}</div>
                        <div class="text-[10px] text-emerald-600 uppercase">Presentes</div>
                    </div>
                    <div class="bg-red-50 rounded p-2">
                        <div class="text-lg sm:text-base font-bold text-red-700">{{ session.attendanceCounts.ABSENT }}</div>
                        <div class="text-[10px] text-red-600 uppercase">Ausentes</div>
                    </div>
                    <div class="bg-amber-50 rounded p-2">
                        <div class="text-lg sm:text-base font-bold text-amber-700">{{ session.attendanceCounts.INCOMPLETE }}</div>
                        <div class="text-[10px] text-amber-600 uppercase">No term.</div>
                    </div>
                </div>

                <!-- Acciones según status — ocupan ancho total en móvil -->
                <div v-if="canAct" class="mt-3 grid grid-cols-1 sm:flex sm:justify-end sm:flex-wrap gap-2">
                    <button
                        v-if="session.status === 'SCHEDULED'"
                        :disabled="busy"
                        class="px-4 py-2.5 text-sm font-bold rounded-lg disabled:opacity-50 transition bg-emerald-600 hover:bg-emerald-700 text-white"
                        @click="open('start')"
                    >
                        ▶ INICIAR EXAMEN
                    </button>

                    <template v-if="session.status === 'IN_PROGRESS'">
                        <button :disabled="busy" class="px-4 py-2.5 text-sm font-bold rounded-lg disabled:opacity-50 transition bg-amber-500 hover:bg-amber-600 text-white" @click="open('pause')">
                            ⏸ PAUSAR
                        </button>
                        <button :disabled="busy" class="px-4 py-2.5 text-sm font-bold rounded-lg disabled:opacity-50 transition bg-red-700 hover:bg-red-800 text-white" @click="open('suspend')">
                            ⚠ SUSPENDER
                        </button>
                        <button :disabled="busy" class="px-4 py-2.5 text-sm font-bold rounded-lg disabled:opacity-50 transition bg-slate-700 hover:bg-slate-800 text-white" @click="open('close')">
                            ◼ CERRAR
                        </button>
                    </template>

                    <template v-if="session.status === 'PAUSED'">
                        <button :disabled="busy" class="px-4 py-2.5 text-sm font-bold rounded-lg disabled:opacity-50 transition bg-emerald-600 hover:bg-emerald-700 text-white" @click="open('resume')">
                            ▶ REANUDAR
                        </button>
                        <button :disabled="busy" class="px-4 py-2.5 text-sm font-bold rounded-lg disabled:opacity-50 transition bg-red-700 hover:bg-red-800 text-white" @click="open('suspend')">
                            ⚠ SUSPENDER
                        </button>
                    </template>
                </div>
            </div>

            <!-- Scanner (sólo IN_PROGRESS) -->
            <div v-if="session.status === 'IN_PROGRESS'" class="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <h2 class="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-700">Scanner QR</h2>
                    <button
                        v-if="!scannerActive"
                        class="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        @click="startScanner"
                    >ESCANEAR</button>
                    <button
                        v-else
                        class="px-3 py-1.5 text-xs rounded-lg border hover:bg-slate-50"
                        @click="stopScanner"
                    >DETENER</button>
                </div>

                <div id="qr-reader" class="rounded-md overflow-hidden bg-slate-100" :class="{ 'min-h-64': scannerActive }"></div>

                <div v-if="lastResult" :class="['rounded-lg p-3 text-sm', lastResult.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800']">
                    <div v-if="lastResult.error">✗ {{ lastResult.error }}</div>
                    <div v-else-if="lastResult.applicant" class="space-y-0.5">
                        <div class="font-semibold">
                            {{ lastResult.alreadyPresent ? '✓ Ya estaba registrado' : '✓ Asistencia registrada' }}
                        </div>
                        <div class="text-emerald-700 text-sm">
                            {{ lastResult.applicant.firstSurname }} {{ lastResult.applicant.secondSurname }} {{ lastResult.applicant.names }}
                        </div>
                        <div class="text-xs text-emerald-600">Folio: {{ lastResult.applicant.preApplicationFolio || '—' }}</div>
                    </div>
                </div>

                <details class="text-xs">
                    <summary class="cursor-pointer text-slate-500 py-1">Ingresar token manualmente</summary>
                    <div class="mt-2 flex gap-2">
                        <input
                            v-model="manualToken"
                            type="text"
                            placeholder="Pegar token (v1.X.YYYYY)"
                            class="flex-1 border rounded px-2 py-1.5 text-xs font-mono min-w-0"
                        />
                        <button class="px-3 py-1.5 text-xs rounded bg-blue-600 text-white whitespace-nowrap" @click="submitManualToken">ENVIAR</button>
                    </div>
                </details>
            </div>

            <!-- Lista de aspirantes: tabla en desktop, tarjetas en móvil -->
            <div class="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 space-y-3">
                <h2 class="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-700">
                    Aspirantes ({{ assignments.length }} / {{ session.capacity }})
                </h2>
                <input
                    v-model="filter"
                    type="text"
                    placeholder="Buscar por nombre o folio..."
                    class="w-full border rounded px-3 py-1.5 text-sm"
                />

                <!-- Desktop table -->
                <div class="hidden sm:block">
                    <table class="w-full text-xs">
                        <thead class="bg-slate-50">
                            <tr class="text-slate-600">
                                <th scope="col" class="px-2 py-1 text-left">Aspirante</th>
                                <th scope="col" class="px-2 py-1 text-left">Folio</th>
                                <th scope="col" class="px-2 py-1 text-center">Estado</th>
                                <th scope="col" class="px-2 py-1 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="a in filteredAssignments" :key="a.id" class="border-t border-slate-100 hover:bg-slate-50">
                                <td class="px-2 py-1 text-slate-800">
                                    {{ a.applicant?.firstSurname }} {{ a.applicant?.secondSurname || '' }} {{ a.applicant?.names }}
                                </td>
                                <td class="px-2 py-1 text-slate-600">{{ a.applicant?.preApplicationFolio || '—' }}</td>
                                <td class="px-2 py-1 text-center">
                                    <span :class="attendanceClass((a as any).attendanceStatus || 'PENDING')" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                                        {{ attendanceLabel((a as any).attendanceStatus || 'PENDING') }}
                                    </span>
                                </td>
                                <td class="px-2 py-1 text-center">
                                    <select
                                        :value="(a as any).attendanceStatus || 'PENDING'"
                                        :disabled="session.status !== 'IN_PROGRESS'"
                                        class="text-xs border rounded px-1.5 py-0.5 disabled:opacity-50"
                                        @change="markStatus(a.id, ($event.target as HTMLSelectElement).value)"
                                    >
                                        <option value="PENDING">Pendiente</option>
                                        <option value="PRESENT">Presente</option>
                                        <option value="ABSENT">Ausente</option>
                                        <option value="INCOMPLETE">No terminó</option>
                                    </select>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile cards -->
                <ul class="sm:hidden space-y-2">
                    <li
                        v-for="a in filteredAssignments"
                        :key="a.id"
                        class="border border-slate-200 rounded-md p-2.5 flex items-start justify-between gap-2"
                    >
                        <div class="min-w-0 flex-1">
                            <div class="text-sm font-medium text-slate-800 leading-tight">
                                {{ a.applicant?.firstSurname }} {{ a.applicant?.secondSurname || '' }} {{ a.applicant?.names }}
                            </div>
                            <div class="text-[11px] text-slate-500 mt-0.5">
                                Folio: {{ a.applicant?.preApplicationFolio || '—' }}
                            </div>
                            <span :class="attendanceClass((a as any).attendanceStatus || 'PENDING')" class="inline-block mt-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                                {{ attendanceLabel((a as any).attendanceStatus || 'PENDING') }}
                            </span>
                        </div>
                        <select
                            :value="(a as any).attendanceStatus || 'PENDING'"
                            :disabled="session.status !== 'IN_PROGRESS'"
                            class="text-xs border rounded px-1.5 py-1 disabled:opacity-50"
                            @change="markStatus(a.id, ($event.target as HTMLSelectElement).value)"
                        >
                            <option value="PENDING">Pendiente</option>
                            <option value="PRESENT">Presente</option>
                            <option value="ABSENT">Ausente</option>
                            <option value="INCOMPLETE">No term.</option>
                        </select>
                    </li>
                </ul>

                <p v-if="filteredAssignments.length === 0" class="text-xs text-slate-400 italic text-center py-3">
                    Sin aspirantes que coincidan.
                </p>
            </div>
        </div>

        <!-- Modal de confirmación / motivo -->
        <div
            v-if="modal.kind"
            class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-3 py-4 sm:p-6"
            @click.self="closeModal"
        >
            <div class="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div class="p-4 sm:p-5 space-y-3">
                    <h3 class="text-base sm:text-lg font-bold text-slate-800">{{ modalTitle }}</h3>
                    <p class="text-sm text-slate-600 leading-snug">{{ modalDescription }}</p>

                    <div v-if="needsReason">
                        <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Motivo<span class="text-red-600">*</span></label>
                        <textarea
                            v-model="modal.reason"
                            rows="3"
                            maxlength="500"
                            class="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                            :placeholder="reasonPlaceholder"
                        />
                        <p class="text-[10px] text-slate-400 mt-1">{{ modal.reason.length }}/500</p>
                    </div>

                    <p v-if="modal.error" class="text-xs text-red-600">{{ modal.error }}</p>

                    <div class="flex gap-2 pt-2">
                        <button
                            class="flex-1 px-3 py-2.5 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                            :disabled="busy"
                            @click="closeModal"
                        >CANCELAR</button>
                        <button
                            :class="['flex-1 px-3 py-2.5 text-sm rounded-md text-white font-bold', confirmBtnClass]"
                            :disabled="busy || (needsReason && !modal.reason.trim())"
                            @click="confirmAction"
                        >{{ busy ? '...' : confirmBtnLabel }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ProctorSessionListItem, CheckInResponse } from '@/modules/admissions/types/exam-attendance.type'
import type { ApplicantExamAssignment } from '@/modules/admissions/types/applicant-exam-assignment.type'

type ModalKind = '' | 'start' | 'close' | 'pause' | 'resume' | 'suspend'

const route = useRoute()

const session = ref<ProctorSessionListItem | null>(null)
const assignments = ref<ApplicantExamAssignment[]>([])
const busy = ref(false)
const scannerActive = ref(false)
const lastResult = ref<{ error?: string; applicant?: any; alreadyPresent?: boolean } | null>(null)
const manualToken = ref('')
const filter = ref('')

const modal = reactive<{ kind: ModalKind; reason: string; error: string | null }>({
    kind: '',
    reason: '',
    error: null,
})

let scanner: Html5Qrcode | null = null

const sessionId = computed(() => Number(route.params.id))

const canAct = computed(() => {
    const s = session.value?.status
    return s === 'SCHEDULED' || s === 'IN_PROGRESS' || s === 'PAUSED'
})

const filteredAssignments = computed(() => {
    if (!filter.value.trim()) return assignments.value
    const q = filter.value.toLowerCase()
    return assignments.value.filter((a) => {
        const nm = `${a.applicant?.firstSurname || ''} ${a.applicant?.secondSurname || ''} ${a.applicant?.names || ''}`.toLowerCase()
        return nm.includes(q) || (a.applicant?.preApplicationFolio || '').toLowerCase().includes(q)
    })
})

const needsReason = computed(() => modal.kind === 'pause' || modal.kind === 'suspend')

const modalTitle = computed(() => ({
    start:   'Iniciar examen',
    close:   'Cerrar sesión',
    pause:   'Pausar sesión',
    resume:  'Reanudar sesión',
    suspend: 'Suspender por incidente',
} as Record<string, string>)[modal.kind] || '')

const modalDescription = computed(() => ({
    start:   'Marca el inicio del examen. Después podrás registrar asistencia con QR o manualmente.',
    close:   'Marcará como AUSENTES a los aspirantes que sigan pendientes y cerrará la sesión. Esta acción no se puede deshacer.',
    pause:   'La sesión quedará en pausa. Mientras esté pausada no se podrá registrar asistencia. Podrás reanudarla cuando quieras.',
    resume:  'Volverá a permitir registrar asistencia. ¿Continuar?',
    suspend: 'La sesión terminará por incidente. Los pendientes y presentes quedarán como NO TERMINÓ (no se cuentan como ausentes). Esta acción no se puede deshacer.',
} as Record<string, string>)[modal.kind] || '')

const reasonPlaceholder = computed(() => modal.kind === 'pause'
    ? 'Ej: Falla eléctrica breve, alarma de simulacro...'
    : 'Ej: Suspensión por brote de violencia, evacuación, etc.')

const confirmBtnLabel = computed(() => ({
    start:   'INICIAR',
    close:   'CERRAR',
    pause:   'PAUSAR',
    resume:  'REANUDAR',
    suspend: 'SUSPENDER',
} as Record<string, string>)[modal.kind] || '')

const confirmBtnClass = computed(() => ({
    start:   'bg-emerald-600 hover:bg-emerald-700',
    close:   'bg-slate-700 hover:bg-slate-800',
    pause:   'bg-amber-500 hover:bg-amber-600',
    resume:  'bg-emerald-600 hover:bg-emerald-700',
    suspend: 'bg-red-700 hover:bg-red-800',
} as Record<string, string>)[modal.kind] || '')

async function load() {
    const [sess, assigns] = await Promise.all([
        api.get(API.ADMISSIONS_API.examAttendance.mySessions),
        api.get(API.ADMISSIONS_API.examSessions.assignments.list(sessionId.value)),
    ])
    const all = [...sess.data.today, ...sess.data.upcoming, ...sess.data.past] as ProctorSessionListItem[]
    session.value = all.find((s) => s.id === sessionId.value) ?? null
    assignments.value = assigns.data
}

function open(kind: ModalKind) {
    modal.kind = kind
    modal.reason = ''
    modal.error = null
}

function closeModal() {
    if (busy.value) return
    modal.kind = ''
    modal.reason = ''
    modal.error = null
}

async function confirmAction() {
    if (!modal.kind) return
    if (needsReason.value && !modal.reason.trim()) {
        modal.error = 'El motivo es requerido.'
        return
    }
    modal.error = null
    busy.value = true
    try {
        const id = sessionId.value
        const reason = modal.reason.trim()
        switch (modal.kind) {
            case 'start':
                await api.post(API.ADMISSIONS_API.examAttendance.start(id))
                break
            case 'close':
                await api.post(API.ADMISSIONS_API.examAttendance.close(id))
                stopScanner()
                break
            case 'pause':
                await api.post(API.ADMISSIONS_API.examAttendance.pause(id), { reason })
                stopScanner()
                break
            case 'resume':
                await api.post(API.ADMISSIONS_API.examAttendance.resume(id))
                break
            case 'suspend':
                await api.post(API.ADMISSIONS_API.examAttendance.suspend(id), { reason })
                stopScanner()
                break
        }
        await load()
        modal.kind = ''
    } catch (e: any) {
        modal.error = e?.response?.data?.message ?? 'No se pudo completar la acción.'
    } finally {
        busy.value = false
    }
}

async function startScanner() {
    if (scannerActive.value) return
    scannerActive.value = true
    lastResult.value = null
    await new Promise((r) => requestAnimationFrame(r))
    try {
        scanner = new Html5Qrcode('qr-reader')
        await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            (decoded: string) => onTokenDecoded(decoded),
            () => { /* ignore parse errors */ },
        )
    } catch (e: any) {
        scannerActive.value = false
        lastResult.value = { error: 'No se pudo iniciar la cámara: ' + (e?.message || e) }
    }
}

async function stopScanner() {
    if (scanner) {
        try { await scanner.stop() } catch { /* */ }
        try { scanner.clear() } catch { /* */ }
        scanner = null
    }
    scannerActive.value = false
}

let lastDecoded = ''
let lastDecodedAt = 0
async function onTokenDecoded(token: string) {
    const now = Date.now()
    if (token === lastDecoded && now - lastDecodedAt < 2000) return
    lastDecoded = token
    lastDecodedAt = now
    await submitToken(token)
}

async function submitManualToken() {
    if (!manualToken.value.trim()) return
    await submitToken(manualToken.value.trim())
    manualToken.value = ''
}

async function submitToken(token: string) {
    try {
        const { data } = await api.post<CheckInResponse>(
            API.ADMISSIONS_API.examAttendance.checkIn(sessionId.value),
            { token },
        )
        lastResult.value = data
        try { new AudioContext().resume() } catch { /* */ }
        await load()
    } catch (e: any) {
        lastResult.value = { error: e?.response?.data?.message ?? 'Token inválido' }
    }
}

async function markStatus(assignmentId: number, status: string) {
    try {
        await api.patch(API.ADMISSIONS_API.examAttendance.mark(assignmentId), { status })
        await load()
    } catch (e: any) {
        lastResult.value = { error: e?.response?.data?.message ?? 'No se pudo cambiar el estado.' }
    }
}

function formatLongDate(s: string): string {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('es-MX', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
}
function formatTime(s: string): string {
    return new Date(s).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function statusLabel(s: string): string {
    return ({
        SCHEDULED: 'Programada', IN_PROGRESS: 'En curso', PAUSED: 'Pausada',
        COMPLETED: 'Concluida', SUSPENDED: 'Suspendida',
        CANCELLED: 'Cancelada', RESCHEDULED: 'Reagendada',
    } as Record<string, string>)[s] ?? s
}
function statusClass(s: string): string {
    return ({
        SCHEDULED:   'bg-blue-100 text-blue-700',
        IN_PROGRESS: 'bg-emerald-100 text-emerald-700',
        PAUSED:      'bg-amber-100 text-amber-700',
        COMPLETED:   'bg-slate-200 text-slate-600',
        SUSPENDED:   'bg-red-200 text-red-800',
        CANCELLED:   'bg-red-100 text-red-700',
        RESCHEDULED: 'bg-purple-100 text-purple-700',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-600'
}
function attendanceLabel(s: string): string {
    return ({
        PENDING: 'Pendiente', PRESENT: 'Presente', ABSENT: 'Ausente', INCOMPLETE: 'No term.',
    } as Record<string, string>)[s] ?? s
}
function attendanceClass(s: string): string {
    return ({
        PENDING: 'bg-slate-100 text-slate-600',
        PRESENT: 'bg-emerald-100 text-emerald-700',
        ABSENT:  'bg-red-100 text-red-700',
        INCOMPLETE: 'bg-amber-100 text-amber-700',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-600'
}

onMounted(load)
onUnmounted(stopScanner)
</script>
