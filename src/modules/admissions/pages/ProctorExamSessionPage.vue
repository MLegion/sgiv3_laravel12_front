<template>
    <div class="space-y-4">
        <RouterLink :to="{ name: 'admissions.proctor.my-sessions' }" class="text-xs text-slate-500 hover:text-blue-600">
            ← Mis sesiones
        </RouterLink>

        <div v-if="!session" class="text-sm text-slate-400 italic">Cargando...</div>

        <div v-else class="space-y-4">
            <!-- Cabecera -->
            <div class="bg-white border border-slate-200 rounded-lg p-4">
                <div class="flex items-start justify-between flex-wrap gap-2">
                    <div>
                        <h1 class="text-lg font-semibold text-slate-800 uppercase">
                            {{ session.place?.name ?? 'Aula —' }}
                        </h1>
                        <p class="text-sm text-slate-600 mt-1">
                            {{ formatLongDate(session.date) }} · {{ session.startTime?.slice(0,5) }} – {{ session.endTime?.slice(0,5) }}
                        </p>
                    </div>
                    <span :class="statusClass(session.status)" class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                        {{ statusLabel(session.status) }}
                    </span>
                </div>

                <div class="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    <div class="bg-slate-50 rounded p-2">
                        <div class="text-base font-bold text-slate-700">{{ session.attendanceCounts.PENDING }}</div>
                        <div class="text-[10px] text-slate-400 uppercase">Pendientes</div>
                    </div>
                    <div class="bg-emerald-50 rounded p-2">
                        <div class="text-base font-bold text-emerald-700">{{ session.attendanceCounts.PRESENT }}</div>
                        <div class="text-[10px] text-emerald-600 uppercase">Presentes</div>
                    </div>
                    <div class="bg-red-50 rounded p-2">
                        <div class="text-base font-bold text-red-700">{{ session.attendanceCounts.ABSENT }}</div>
                        <div class="text-[10px] text-red-600 uppercase">Ausentes</div>
                    </div>
                    <div class="bg-amber-50 rounded p-2">
                        <div class="text-base font-bold text-amber-700">{{ session.attendanceCounts.INCOMPLETE }}</div>
                        <div class="text-[10px] text-amber-600 uppercase">No term.</div>
                    </div>
                </div>

                <!-- Acciones según status -->
                <div class="mt-4 flex gap-2 justify-end">
                    <button
                        v-if="session.status === 'SCHEDULED'"
                        :disabled="busy"
                        class="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        @click="onStart"
                    >
                        {{ busy ? '...' : 'INICIAR EXAMEN' }}
                    </button>
                    <button
                        v-if="session.status === 'IN_PROGRESS'"
                        :disabled="busy"
                        class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        @click="onClose"
                    >
                        {{ busy ? '...' : 'CERRAR SESIÓN' }}
                    </button>
                </div>
            </div>

            <!-- Scanner (sólo si IN_PROGRESS) -->
            <div v-if="session.status === 'IN_PROGRESS'" class="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">Scanner QR</h2>
                    <button
                        v-if="!scannerActive"
                        class="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        @click="startScanner"
                    >
                        INICIAR ESCÁNER
                    </button>
                    <button
                        v-else
                        class="px-3 py-1.5 text-xs rounded-lg border hover:bg-slate-50"
                        @click="stopScanner"
                    >
                        DETENER
                    </button>
                </div>

                <div id="qr-reader" class="rounded-md overflow-hidden bg-slate-100" :class="{ 'min-h-64': scannerActive }"></div>

                <div v-if="lastResult" :class="['rounded-lg p-3 text-sm', lastResult.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800']">
                    <div v-if="lastResult.error">✗ {{ lastResult.error }}</div>
                    <div v-else-if="lastResult.applicant" class="space-y-0.5">
                        <div class="font-semibold">
                            {{ lastResult.alreadyPresent ? '✓ Ya estaba registrado' : '✓ Asistencia registrada' }}
                        </div>
                        <div class="text-emerald-700">
                            {{ lastResult.applicant.firstSurname }} {{ lastResult.applicant.secondSurname }} {{ lastResult.applicant.names }}
                        </div>
                        <div class="text-xs text-emerald-600">Folio: {{ lastResult.applicant.preApplicationFolio || '—' }}</div>
                    </div>
                </div>

                <details class="text-xs">
                    <summary class="cursor-pointer text-slate-500">Ingresar token manualmente</summary>
                    <div class="mt-2 flex gap-2">
                        <input
                            v-model="manualToken"
                            type="text"
                            placeholder="Pegar token (v1.X.YYYYY)"
                            class="flex-1 border rounded px-2 py-1 text-xs font-mono"
                        />
                        <button
                            class="px-3 py-1 text-xs rounded bg-blue-600 text-white"
                            @click="submitManualToken"
                        >ENVIAR</button>
                    </div>
                </details>
            </div>

            <!-- Lista de aspirantes con marcado manual -->
            <div class="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">
                    Aspirantes ({{ assignments.length }} / {{ session.capacity }})
                </h2>
                <input
                    v-model="filter"
                    type="text"
                    placeholder="Buscar por nombre o folio..."
                    class="w-full border rounded px-3 py-1.5 text-xs"
                />
                <table class="w-full text-xs">
                    <thead class="bg-slate-50">
                        <tr class="text-slate-600">
                            <th class="px-2 py-1 text-left">Aspirante</th>
                            <th class="px-2 py-1 text-left">Folio</th>
                            <th class="px-2 py-1 text-center">Estado</th>
                            <th class="px-2 py-1 text-center">Acción rápida</th>
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
                <p v-if="filteredAssignments.length === 0" class="text-xs text-slate-400 italic text-center py-3">
                    Sin aspirantes que coincidan.
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ProctorSessionListItem, CheckInResponse } from '@/modules/admissions/types/exam-attendance.type'
import type { ApplicantExamAssignment } from '@/modules/admissions/types/applicant-exam-assignment.type'

const route = useRoute()

const session = ref<ProctorSessionListItem | null>(null)
const assignments = ref<ApplicantExamAssignment[]>([])
const busy = ref(false)
const scannerActive = ref(false)
const lastResult = ref<{ error?: string; applicant?: any; alreadyPresent?: boolean } | null>(null)
const manualToken = ref('')
const filter = ref('')

let scanner: Html5Qrcode | null = null

const sessionId = computed(() => Number(route.params.id))

const filteredAssignments = computed(() => {
    if (!filter.value.trim()) return assignments.value
    const q = filter.value.toLowerCase()
    return assignments.value.filter((a) => {
        const nm = `${a.applicant?.firstSurname || ''} ${a.applicant?.secondSurname || ''} ${a.applicant?.names || ''}`.toLowerCase()
        return nm.includes(q) || (a.applicant?.preApplicationFolio || '').toLowerCase().includes(q)
    })
})

async function load() {
    const [sess, assigns] = await Promise.all([
        api.get(API.ADMISSIONS_API.examAttendance.mySessions),
        api.get(API.ADMISSIONS_API.examSessions.assignments.list(sessionId.value)),
    ])
    const all = [...sess.data.today, ...sess.data.upcoming, ...sess.data.past] as ProctorSessionListItem[]
    session.value = all.find((s) => s.id === sessionId.value) ?? null
    assignments.value = assigns.data
}

async function onStart() {
    busy.value = true
    try {
        await api.post(API.ADMISSIONS_API.examAttendance.start(sessionId.value))
        await load()
    } catch (e: any) {
        alert(e?.response?.data?.message ?? 'No se pudo iniciar la sesión.')
    } finally {
        busy.value = false
    }
}

async function onClose() {
    if (!confirm('Cerrar la sesión marcará como AUSENTES a los pendientes. ¿Continuar?')) return
    busy.value = true
    try {
        await api.post(API.ADMISSIONS_API.examAttendance.close(sessionId.value))
        stopScanner()
        await load()
    } catch (e: any) {
        alert(e?.response?.data?.message ?? 'No se pudo cerrar la sesión.')
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
        try { await scanner.stop() } catch { /* ignore */ }
        try { scanner.clear() } catch { /* ignore */ }
        scanner = null
    }
    scannerActive.value = false
}

let lastDecoded = ''
let lastDecodedAt = 0
async function onTokenDecoded(token: string) {
    const now = Date.now()
    // Evita duplicados rápidos del mismo código (la cámara dispara muchas veces)
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
        // beep simple
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
        alert(e?.response?.data?.message ?? 'No se pudo cambiar el estado.')
    }
}

function formatLongDate(s: string): string {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('es-MX', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
}

function statusLabel(s: string): string {
    return ({
        SCHEDULED: 'Programada', IN_PROGRESS: 'En curso',
        COMPLETED: 'Concluida', CANCELLED: 'Cancelada', RESCHEDULED: 'Reagendada',
    } as Record<string, string>)[s] ?? s
}
function statusClass(s: string): string {
    return ({
        SCHEDULED: 'bg-blue-100 text-blue-700',
        IN_PROGRESS: 'bg-emerald-100 text-emerald-700',
        COMPLETED: 'bg-slate-200 text-slate-600',
        CANCELLED: 'bg-red-100 text-red-700',
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
