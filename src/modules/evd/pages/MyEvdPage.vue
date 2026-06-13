<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { MyEvdAssignment, MyEvdStatus } from '@/modules/evd/types/evd.type'

interface ActivePeriod {
    open: boolean
    message?: string
    collegeAcademicPeriodId?: number
    period?: { id: number; name: string; shortName: string } | null
}

const router = useRouter()

const activePeriod = ref<ActivePeriod | null>(null)
const status       = ref<MyEvdStatus | null>(null)
const loading      = ref(true)
const error        = ref('')
const startingId   = ref<number | null>(null)

const pendingCount   = computed(() =>
    (status.value?.assignments ?? []).filter(i => i.status === 'pending' || i.status === 'in_progress').length,
)
const completedCount = computed(() => status.value?.completed ?? 0)
const total          = computed(() => status.value?.total ?? 0)
const progressPct    = computed(() => status.value?.progress_pct ?? 0)

// ── 5 estados de la UI ─────────────────────────────────────────────
const uiState = computed<'loading' | 'no_period_active' | 'no_tep_in_period' | 'modality_closed' | 'no_assignments' | 'all_completed' | 'has_pending'>(() => {
    if (loading.value) return 'loading'
    if (!activePeriod.value?.open) return 'no_period_active'
    if (!status.value) return 'loading'
    if (!status.value.period_has_any_tep) return 'no_tep_in_period'
    if (!status.value.modality_tep_open)  return 'modality_closed'
    if (status.value.total === 0)         return 'no_assignments'
    if (status.value.acuse !== null && status.value.completed === status.value.total) return 'all_completed'
    return 'has_pending'
})

async function load() {
    loading.value = true
    error.value = ''
    try {
        const { data: ap } = await api.get(API.EVD_API.myActivePeriod)
        activePeriod.value = ap
        if (!ap?.open || !ap.collegeAcademicPeriodId) {
            status.value = null
            return
        }
        const { data } = await api.get<MyEvdStatus>(API.EVD_API.myStatus, {
            params: { college_academic_period_id: ap.collegeAcademicPeriodId },
        })
        status.value = data
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? e?.message ?? 'No se pudieron cargar tus evaluaciones.'
    } finally {
        loading.value = false
    }
}

function startEvaluation(it: MyEvdAssignment) {
    if (it.status === 'completed' || startingId.value !== null) return
    // El cuestionario se abre EMBEBIDO en el layout de sgiv3 (ruta nativa).
    // Esa página pide el token EVD y habla directo con el API de sgi_forms.
    router.push({ name: 'evd.attempt', params: { assignmentId: it.assignment_id } })
}

function formatDateTime(s: string | null): string {
    if (!s) return '—'
    try {
        const d = new Date(s)
        return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
    } catch {
        return s
    }
}

onMounted(load)
</script>

<template>
    <div class="space-y-4 max-w-5xl">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mi Evaluación Docente</h1>
            <div v-if="status && total > 0" class="text-xs text-slate-500">
                <span class="text-2xl font-bold tabular-nums text-blue-700">{{ pendingCount }}</span>
                <span class="ml-1 text-[10px] uppercase">pendientes</span>
                <span class="mx-2 text-slate-300">·</span>
                <span class="text-2xl font-bold tabular-nums text-emerald-700">{{ completedCount }}</span>
                <span class="ml-1 text-[10px] uppercase">completadas</span>
                <span class="mx-2 text-slate-300">·</span>
                <span class="text-xs">{{ progressPct }}%</span>
            </div>
        </div>

        <!-- Barra de progreso visible mientras haya assignments -->
        <div v-if="status && total > 0" class="bg-white border border-slate-200 rounded p-2">
            <div class="h-2 bg-slate-100 rounded overflow-hidden">
                <div class="h-full bg-emerald-500 transition-all" :style="{ width: progressPct + '%' }"></div>
            </div>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">
            {{ error }}
        </div>

        <!-- (loading) ─────────────────────────────────────────────────── -->
        <div v-if="uiState === 'loading'"
             class="bg-white border rounded-xl shadow-sm p-6 text-center text-sm text-slate-400">
            Cargando…
        </div>

        <!-- (a) Sin periodo activo en el college ──────────────────────── -->
        <div v-else-if="uiState === 'no_period_active'"
             class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <div class="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
            </div>
            <h2 class="text-base font-bold text-amber-800 uppercase">No hay evaluación docente activa</h2>
            <p class="text-sm text-amber-700 mt-2 max-w-md mx-auto">
                Actualmente tu plantel no tiene un periodo de evaluación docente abierto. Vuelve cuando se anuncie la fecha de apertura.
            </p>
        </div>

        <!-- (a') Hay periodo SCA pero ningún TEP — mismo mensaje práctico -->
        <div v-else-if="uiState === 'no_tep_in_period'"
             class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <h2 class="text-base font-bold text-amber-800 uppercase">No hay evaluación docente activa</h2>
            <p class="text-sm text-amber-700 mt-2 max-w-md mx-auto">
                Aún no se ha abierto la evaluación docente para este periodo.
            </p>
        </div>

        <!-- (b) Modalidad del alumno cerrada ─────────────────────────── -->
        <div v-else-if="uiState === 'modality_closed'"
             class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <div class="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                </svg>
            </div>
            <h2 class="text-base font-bold text-amber-800 uppercase">Evaluación cerrada para tu modalidad</h2>
            <p class="text-sm text-amber-700 mt-2 max-w-md mx-auto">
                La evaluación docente está abierta para otras modalidades, pero aún no para la tuya. Tu plantel definirá cuándo abrirla.
            </p>
        </div>

        <!-- Sin assignments todavía (caso edge: TEP abierto pero sin matrícula) -->
        <div v-else-if="uiState === 'no_assignments'"
             class="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
            No tienes evaluaciones asignadas para este periodo.
        </div>

        <!-- (e) Acuse de término — 100% completado ─────────────────────── -->
        <div v-else-if="uiState === 'all_completed' && status?.acuse" class="space-y-3">
            <div class="bg-emerald-50 border border-emerald-300 rounded-xl p-6 flex items-start gap-4">
                <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-10 h-10 text-emerald-600">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <div class="flex-1">
                    <div class="text-[10px] uppercase font-black text-emerald-700 tracking-wider">Acuse de término</div>
                    <h2 class="text-xl font-bold text-emerald-800 uppercase">Evaluación docente completada</h2>
                    <p class="text-sm text-emerald-700 mt-1">
                        Concluiste el 100% de tus evaluaciones del periodo.
                    </p>
                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                            <div class="text-[10px] uppercase font-black text-emerald-600 tracking-wider">Folio</div>
                            <div class="font-mono text-base text-slate-800">{{ status.acuse.folio }}</div>
                        </div>
                        <div>
                            <div class="text-[10px] uppercase font-black text-emerald-600 tracking-wider">Fecha</div>
                            <div class="text-base text-slate-800">{{ formatDateTime(status.acuse.issued_at) }}</div>
                        </div>
                        <div>
                            <div class="text-[10px] uppercase font-black text-emerald-600 tracking-wider">Evaluaciones</div>
                            <div class="text-base text-slate-800">
                                <span class="font-bold tabular-nums">{{ status.acuse.total_completed }}</span>
                                completadas
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resumen de las materias evaluadas (solo lectura) -->
            <div class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3 bg-slate-50">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">Materias evaluadas</h3>
                </div>
                <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th scope="col" class="text-left px-4 py-2">MATERIA</th>
                            <th scope="col" class="text-left px-4 py-2 w-32">GRUPO</th>
                            <th scope="col" class="text-left px-4 py-2">DOCENTE</th>
                            <th scope="col" class="text-left px-4 py-2 w-36">FECHA</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="a in status.assignments" :key="a.assignment_id">
                            <td class="px-4 py-2">
                                <div class="font-bold text-slate-700">{{ a.subject.name }}</div>
                                <div class="text-[10px] font-mono text-slate-400">{{ a.subject.official_code ?? '—' }}</div>
                            </td>
                            <td class="px-4 py-2 font-mono text-xs text-slate-700">{{ a.group.name ?? '—' }}</td>
                            <td class="px-4 py-2 text-xs text-slate-600">{{ a.teacher?.name ?? '—' }}</td>
                            <td class="px-4 py-2 text-xs text-slate-500">{{ formatDateTime(a.completed_at) }}</td>
                        </tr>
                    </tbody>
                </table></div>
            </div>
        </div>

        <!-- (c/d) Tabla: materias con su estado + acción ─────────────────── -->
        <div v-else-if="uiState === 'has_pending'" class="space-y-2">
            <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th scope="col" class="text-left px-4 py-2 w-36">Estado</th>
                            <th scope="col" class="text-left px-4 py-2">Materia</th>
                            <th scope="col" class="text-left px-4 py-2 w-28">Grupo</th>
                            <th scope="col" class="text-left px-4 py-2">Docente</th>
                            <th scope="col" class="text-right px-4 py-2 w-40">Acción</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="it in status?.assignments ?? []" :key="it.assignment_id" class="hover:bg-slate-50/60">
                            <td class="px-4 py-2.5">
                                <span v-if="it.status === 'completed'"
                                      class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                                    </svg>
                                    Ya realizada
                                </span>
                                <span v-else-if="it.status === 'in_progress'"
                                      class="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-amber-100 text-amber-700">
                                    En progreso
                                </span>
                                <span v-else
                                      class="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-blue-100 text-blue-700">
                                    Pendiente
                                </span>
                            </td>
                            <td class="px-4 py-2.5">
                                <div class="font-bold text-slate-800 uppercase">{{ it.subject.name }}</div>
                                <div class="text-[10px] font-mono text-slate-400">{{ it.subject.official_code ?? '—' }}</div>
                            </td>
                            <td class="px-4 py-2.5 font-mono text-xs text-slate-700">{{ it.group.name ?? '—' }}</td>
                            <td class="px-4 py-2.5 text-xs text-slate-600">{{ it.teacher?.name ?? '— por asignar —' }}</td>
                            <td class="px-4 py-2.5 text-right">
                                <button v-if="it.status !== 'completed'"
                                    :disabled="startingId !== null"
                                    class="px-3 py-1.5 rounded-md text-xs font-bold text-white disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
                                    @click="startEvaluation(it)"
                                >
                                    <template v-if="startingId === it.assignment_id">Abriendo…</template>
                                    <template v-else-if="it.status === 'in_progress'">CONTINUAR</template>
                                    <template v-else>EVALUAR</template>
                                </button>
                                <span v-else class="text-[10px] text-slate-400">{{ formatDateTime(it.completed_at) }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table></div>
            </div>
        </div>
    </div>
</template>
