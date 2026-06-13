<template>
    <div class="space-y-4">
        <RouterLink :to="{ name: 'admissions.exam-sessions' }" class="text-xs text-slate-500 hover:text-blue-600">
            ← Sesiones de Examen
        </RouterLink>

        <h1 class="text-xl font-semibold text-slate-800 uppercase">Distribución de Aspirantes</h1>

        <div class="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <p class="text-xs text-slate-500">
                Se respeta el campus del aspirante (HARD) y se prefiere homogeneidad por modalidad y carrera (SOFT).
                Sólo se asignan aspirantes <strong>sin sesión previa</strong> en el periodo. La capacidad por sesión es tope duro.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Periodo académico</label>
                    <FormRemoteSelect
                        v-model="periodId"
                        :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                        :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                        :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                        item-label="name"
                        item-value="academicPeriodId"
                        placeholder="Seleccionar período..."
                    />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Estrategia (desempate)</label>
                    <select v-model="strategy" class="field">
                        <option value="BY_LASTNAME">Por apellido (alfabético)</option>
                        <option value="BY_FOLIO">Por folio (preficha)</option>
                        <option value="BY_REGISTRATION_DATE">Por fecha de registro</option>
                        <option value="RANDOM">Aleatorio</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button
                        class="w-full px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        :disabled="!periodId || running"
                        @click="run"
                    >
                        {{ running ? 'DISTRIBUYENDO...' : 'AUTO-DISTRIBUIR' }}
                    </button>
                </div>
            </div>

            <div v-if="lastResult" class="border border-slate-200 rounded-md p-3 text-sm bg-slate-50">
                <p>
                    <strong>{{ lastResult.assigned }}</strong> aspirantes asignados ·
                    <strong>{{ lastResult.unassigned }}</strong> sin asignar.
                </p>
                <p v-if="lastResult.message" class="text-xs text-slate-500 italic mt-1">{{ lastResult.message }}</p>
            </div>

            <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
        </div>

        <!-- Sesiones por periodo -->
        <div v-if="periodId" class="bg-white border border-slate-200 rounded-lg p-4">
            <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700 mb-3">
                Estado de sesiones del periodo
            </h2>

            <div v-if="loadingSessions" class="text-xs text-slate-400 italic">Cargando...</div>
            <div v-else-if="sessions.length > 0" class="overflow-x-auto w-full"><table class="w-full text-xs border border-slate-200 rounded-md overflow-hidden">
                <thead class="bg-slate-50">
                    <tr class="text-slate-600">
                        <th scope="col" class="px-2 py-1 text-left">#</th>
                        <th scope="col" class="px-2 py-1 text-left">Fecha</th>
                        <th scope="col" class="px-2 py-1 text-left">Horario</th>
                        <th scope="col" class="px-2 py-1 text-left">Aula</th>
                        <th scope="col" class="px-2 py-1 text-left">Ocupación</th>
                        <th scope="col" class="px-2 py-1 text-center">Estado</th>
                        <th scope="col" class="px-2 py-1 text-center"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="s in sessions" :key="s.id" class="border-t border-slate-100 hover:bg-slate-50">
                        <td class="px-2 py-1 text-slate-500">#{{ s.id }}</td>
                        <td class="px-2 py-1">{{ formatDate(s.date) }}</td>
                        <td class="px-2 py-1">{{ s.startTime?.slice(0, 5) }} – {{ s.endTime?.slice(0, 5) }}</td>
                        <td class="px-2 py-1">{{ s.place?.name ?? '—' }}</td>
                        <td class="px-2 py-1">
                            <div class="flex items-center gap-2">
                                <span>{{ s.assignedCount }} / {{ s.capacity }}</span>
                                <div class="flex-1 max-w-[120px] h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div class="h-full bg-blue-500" :style="{ width: occupancyPct(s) + '%' }" />
                                </div>
                            </div>
                        </td>
                        <td class="px-2 py-1 text-center">
                            <span :class="statusClass(s.status)" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">
                                {{ s.status }}
                            </span>
                        </td>
                        <td class="px-2 py-1 text-center">
                            <RouterLink
                                :to="{ name: 'admissions.exam-sessions.detail', params: { id: s.id } }"
                                class="text-blue-600 hover:underline text-[11px]"
                            >
                                Detalle
                            </RouterLink>
                        </td>
                    </tr>
                </tbody>
            </table></div>
            <p v-else class="text-xs text-slate-400 italic">Sin sesiones en este periodo.</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import type { ExamSession } from '@/modules/admissions/types/exam-session.type'
import type { AutoDistributeStrategy } from '@/modules/admissions/types/applicant-exam-assignment.type'

const route = useRoute()

const periodId = ref<number | null>(route.query.period ? Number(route.query.period) : null)
const strategy = ref<AutoDistributeStrategy>('BY_LASTNAME')
const running  = ref(false)
const error    = ref<string | null>(null)

const lastResult = ref<{ assigned: number; unassigned: number; message?: string } | null>(null)

const sessions       = ref<ExamSession[]>([])
const loadingSessions = ref(false)

watch(periodId, (v) => {
    if (v) loadSessions()
    else sessions.value = []
}, { immediate: true })

async function loadSessions() {
    loadingSessions.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.examSessions.list, {
            params: {
                page:      1,
                per_page:  100,
                search:    { academic_period_id: periodId.value },
                order_by:  'date',
                order_dir: 'asc',
            },
        })
        sessions.value = data?.data ?? []
    } finally {
        loadingSessions.value = false
    }
}

async function run() {
    if (!periodId.value) return
    error.value = null
    running.value = true
    try {
        const { data } = await api.post(API.ADMISSIONS_API.examAssignments.autoDistribute, {
            academic_period_id: periodId.value,
            strategy:           strategy.value,
        })
        lastResult.value = data
        await loadSessions()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo distribuir.'
    } finally {
        running.value = false
    }
}

function formatDate(s: string): string {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function occupancyPct(s: ExamSession): number {
    if (!s.capacity) return 0
    return Math.min(100, Math.round((s.assignedCount / s.capacity) * 100))
}

function statusClass(s: string): string {
    const map: Record<string, string> = {
        SCHEDULED:   'bg-blue-100 text-blue-700',
        IN_PROGRESS: 'bg-emerald-100 text-emerald-700',
        COMPLETED:   'bg-slate-200 text-slate-600',
        CANCELLED:   'bg-red-100 text-red-700',
        RESCHEDULED: 'bg-purple-100 text-purple-700',
    }
    return map[s] ?? 'bg-slate-100 text-slate-600'
}
</script>

<style scoped>
.field {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    outline: none;
}
.field:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px #e0e7ff;
}
</style>
