<template>
    <teleport to="body">
        <div v-if="open" class="fixed inset-0 z-[120]">
            <div class="absolute inset-0 bg-black/40" @click="close"></div>

            <aside class="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
                <header class="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <h2 class="text-lg font-semibold text-slate-800 uppercase tracking-wide">Generación Automática</h2>
                        <p class="text-xs text-slate-500 mt-0.5">Carrera: <b>{{ careerLabel || `#${careerId}` }}</b></p>
                        <p v-if="campusLabel || modalityTypeLabel" class="text-xs text-slate-500 mt-0.5">
                            <span v-if="campusLabel">Campus: <b>{{ campusLabel }}</b></span>
                            <span v-if="campusLabel && modalityTypeLabel"> · </span>
                            <span v-if="modalityTypeLabel">Modalidad: <b>{{ modalityTypeLabel }}</b></span>
                        </p>
                    </div>
                    <button type="button" class="text-slate-400 hover:text-slate-700 text-xl shrink-0" @click="close">×</button>
                </header>

                <!-- Estado global -->
                <div v-if="msg.message" class="mx-6 mt-4 text-sm px-4 py-3 rounded-lg"
                    :class="msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'">
                    {{ msg.message }}
                </div>

                <!-- Formulario de nueva corrida -->
                <section class="px-6 py-5 space-y-5 border-b">
                    <h3 class="text-xs font-bold text-blue-600 uppercase tracking-[0.2em]">Nueva corrida</h3>

                    <div class="grid grid-cols-2 gap-4">
                        <label class="block">
                            <span class="text-xs font-semibold text-slate-600">Timeout (seg)</span>
                            <input type="number" min="30" max="900" v-model.number="form.timeoutSeconds"
                                class="mt-1 w-full h-9 border rounded-md px-3 text-sm" />
                        </label>
                        <label class="block">
                            <span class="text-xs font-semibold text-slate-600">Borradores a generar</span>
                            <input type="number" min="1" max="5" v-model.number="form.countDrafts"
                                class="mt-1 w-full h-9 border rounded-md px-3 text-sm" />
                        </label>
                    </div>

                    <label class="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" v-model="form.decomposeBySemester"
                            class="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <div class="flex-1">
                            <span class="text-xs font-semibold text-slate-700 block">Resolver semestre por semestre</span>
                            <span class="text-[10px] text-slate-500 block mt-0.5">
                                Recomendado para carreras grandes (50+ paquetes). El solver trabaja un semestre a la vez
                                respetando las reservas colocadas. Más lento total pero mucho más estable.
                            </span>
                        </div>
                    </label>

                    <div>
                        <span class="text-xs font-semibold text-slate-600 block mb-2">Pesos soft (0 = desactivado)</span>
                        <div class="space-y-2">
                            <label v-for="k in weightKeys" :key="k" class="flex items-center gap-3">
                                <span class="text-xs text-slate-700 w-52">{{ weightLabels[k] }}</span>
                                <input type="range" min="0" max="10" v-model.number="form.weights[k]" class="flex-1" />
                                <span class="text-xs font-mono text-slate-500 w-6 text-right">{{ form.weights[k] }}</span>
                            </label>
                        </div>
                        <p class="text-[10px] text-slate-400 mt-2">
                            Sugerencia: con cargas grandes, usar sólo 1-2 pesos simultáneos para evitar timeout.
                        </p>
                    </div>

                    <div class="flex justify-end gap-2 pt-2 border-t">
                        <button type="button" :disabled="saving"
                            class="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 uppercase"
                            @click="generate">
                            {{ saving ? 'Generando…' : 'Generar borrador' }}
                        </button>
                    </div>
                </section>

                <!-- Lista de runs existentes -->
                <section class="px-6 py-5">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-xs font-bold text-blue-600 uppercase tracking-[0.2em]">Borradores</h3>
                        <button type="button" class="text-[10px] text-slate-500 hover:text-slate-700 uppercase font-bold"
                            @click="() => loadRuns()">↻ Refrescar</button>
                    </div>

                    <div v-if="loadingRuns" class="text-sm text-slate-400 italic">Cargando…</div>

                    <div v-else-if="runs.length === 0"
                        class="bg-slate-50 border border-dashed rounded-lg p-6 text-center text-sm text-slate-400 italic">
                        Aún no se ha generado ningún borrador para esta carrera.
                    </div>

                    <div v-else class="space-y-3">
                        <article v-for="r in runs" :key="r.id"
                            class="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <header class="flex items-start justify-between gap-3">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-bold text-slate-800">#{{ r.id }}</span>
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1"
                                            :class="statusClasses[r.status]">
                                            <span v-if="!isTerminal(r.status)" class="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></span>
                                            {{ statusLabels[r.status] }}
                                        </span>
                                        <span class="text-[10px] text-slate-400 font-mono">{{ r.providerKind }}</span>
                                    </div>
                                    <p class="text-[10px] text-slate-400 mt-1">
                                        {{ formatDate(r.createdAt) }} ·
                                        bloques: <b>{{ r.blocksCount }}</b>
                                        <span v-if="r.solutionSummary?.stats?.softScore != null">
                                            · score: <b>{{ r.solutionSummary.stats.softScore }}</b>
                                        </span>
                                        <span v-if="r.solutionSummary?.stats?.durationMs != null">
                                            · {{ Math.round(r.solutionSummary.stats.durationMs / 1000) }}s
                                        </span>
                                    </p>
                                </div>
                                <div class="flex gap-2 flex-shrink-0">
                                    <button v-if="r.status === 'ready'"
                                        :disabled="busyRunId === r.id"
                                        class="px-3 py-1.5 text-[10px] font-bold rounded border border-blue-400 text-blue-700 hover:bg-blue-50 uppercase disabled:opacity-60"
                                        @click="openPreview(r.id)">
                                        Ver borrador
                                    </button>
                                    <button v-if="r.status === 'ready'"
                                        :disabled="busyRunId === r.id"
                                        class="px-3 py-1.5 text-[10px] font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700 uppercase disabled:opacity-60"
                                        @click="promote(r.id)">
                                        Promover
                                    </button>
                                    <button v-if="!isTerminal(r.status)"
                                        :disabled="busyRunId === r.id"
                                        class="px-3 py-1.5 text-[10px] font-bold rounded border border-red-300 text-red-700 hover:bg-red-50 uppercase disabled:opacity-60"
                                        @click="discard(r.id)"
                                        title="Cancela el solver si está activo">
                                        Cancelar
                                    </button>
                                    <button v-else
                                        :disabled="busyRunId === r.id"
                                        class="p-1.5 rounded border border-slate-300 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 disabled:opacity-60 transition"
                                        :title="r.status === 'promoted' ? 'Borrar registro del historial (el horario promovido no se ve afectado)' : 'Borrar'"
                                        @click="deleteRun(r)">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" />
                                        </svg>
                                    </button>
                                </div>
                            </header>

                            <!-- Progreso por tiempo -->
                            <div v-if="r.startedAt && r.timeoutSeconds" class="mt-3">
                                <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                                    <span>{{ elapsedLabel(r) }} / {{ r.timeoutSeconds }}s</span>
                                    <span>{{ Math.round(progressPct(r)) }}%</span>
                                </div>
                                <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        class="h-full rounded-full transition-all duration-500 ease-out"
                                        :class="progressBarClass(r)"
                                        :style="{ width: progressPct(r) + '%' }"
                                    ></div>
                                </div>
                            </div>

                            <!-- Diagnóstico INFEASIBLE / timeout / error -->
                            <div v-if="r.solutionSummary?.diagnostics?.reason"
                                class="mt-3 rounded p-3 border"
                                :class="r.status === 'infeasible'
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-amber-50 border-amber-200'">
                                <p class="text-[11px] font-bold uppercase tracking-wide"
                                    :class="r.status === 'infeasible' ? 'text-red-700' : 'text-amber-700'">
                                    {{ diagnosticLabel(r.solutionSummary.diagnostics.reason) }}
                                </p>
                                <p v-if="r.solutionSummary.diagnostics.details?.message"
                                    class="text-[11px] mt-1"
                                    :class="r.status === 'infeasible' ? 'text-red-700' : 'text-amber-700'">
                                    {{ r.solutionSummary.diagnostics.details.message }}
                                </p>
                                <dl v-if="hasDetailFields(r.solutionSummary.diagnostics.details)"
                                    class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]"
                                    :class="r.status === 'infeasible' ? 'text-red-700' : 'text-amber-700'">
                                    <template v-for="(v, k) in detailFields(r.solutionSummary.diagnostics.details)" :key="k">
                                        <dt class="font-semibold">{{ formatFieldLabel(String(k)) }}</dt>
                                        <dd class="font-mono">{{ formatFieldValue(v) }}</dd>
                                    </template>
                                </dl>
                                <p v-if="r.solutionSummary.diagnostics.details?.hint"
                                    class="text-[10px] mt-2 italic"
                                    :class="r.status === 'infeasible' ? 'text-red-600' : 'text-amber-600'">
                                    💡 {{ r.solutionSummary.diagnostics.details.hint }}
                                </p>
                            </div>

                            <!-- Conflictos si promoción falló -->
                            <div v-if="conflictsByRun[r.id]" class="mt-3 bg-red-50 border border-red-200 rounded p-3">
                                <p class="text-[11px] font-bold text-red-700 uppercase">Conflictos al promover</p>
                                <ul class="text-[11px] text-red-700 mt-1 space-y-1">
                                    <li v-for="(errs, draftId) in conflictsByRun[r.id]" :key="draftId">
                                        <b>Bloque #{{ draftId }}:</b>
                                        <span v-for="(m, k) in errs" :key="k">{{ m }}<span class="text-red-400"> · </span></span>
                                    </li>
                                </ul>
                            </div>
                        </article>
                    </div>
                </section>
            </aside>
        </div>
    </teleport>

    <!-- ═════ Modal: Preview del borrador ═════ -->
    <teleport to="body">
        <div v-if="preview.runId !== null" class="fixed inset-0 z-[130]">
            <div class="absolute inset-0 bg-black/50" @click="closePreview"></div>
            <div class="absolute inset-4 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
                <header class="flex items-center justify-between px-5 py-3 border-b bg-slate-50">
                    <div>
                        <h3 class="text-sm font-bold text-slate-800">
                            Borrador #{{ preview.runId }}
                            <span v-if="preview.data" class="text-slate-400 font-normal ml-2">
                                — {{ preview.data.drafts.length }} bloques
                                <span v-if="preview.data.solutionSummary?.stats?.softScore != null">
                                    · score {{ preview.data.solutionSummary.stats.softScore }}
                                </span>
                            </span>
                        </h3>
                        <p class="text-[10px] text-slate-400 mt-0.5">
                            Agrupación por <b>{{ preview.groupBy === 'group' ? 'grupo' : preview.groupBy === 'teacher' ? 'docente' : 'aula' }}</b>
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <select v-model="preview.groupBy" class="text-xs border rounded px-2 py-1 h-8">
                            <option value="group">Por grupo</option>
                            <option value="teacher">Por docente</option>
                            <option value="place">Por aula</option>
                        </select>
                        <button type="button" class="text-slate-400 hover:text-slate-700" @click="closePreview">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </header>

                <div v-if="preview.loading" class="flex-1 flex items-center justify-center text-sm text-slate-400 italic">
                    Cargando borrador…
                </div>

                <div v-else-if="!preview.data || !preview.data.drafts.length" class="flex-1 flex items-center justify-center text-sm text-slate-400 italic">
                    Sin bloques en el borrador.
                </div>

                <div v-else class="flex-1 overflow-auto p-4 space-y-4 bg-slate-50">
                    <section v-for="g in previewGroups" :key="g.key" class="bg-white border rounded-lg overflow-hidden">
                        <div class="px-3 py-2 bg-slate-100 border-b">
                            <span class="text-xs font-bold text-slate-700 uppercase">{{ g.label }}</span>
                            <span class="text-[10px] text-slate-400 ml-2">{{ g.blocks.length }} bloques</span>
                        </div>
                        <div class="overflow-x-auto">
                            <div class="grid min-w-[800px]" :style="previewGridStyle">
                                <!-- Header -->
                                <div class="bg-slate-50 border-b border-r p-1.5 text-[10px] font-bold text-slate-500 text-center">Hora</div>
                                <div v-for="d in DAYS" :key="'h-' + d.value"
                                     class="bg-slate-50 border-b border-r p-1.5 text-[10px] font-bold text-slate-500 text-center leading-tight">
                                    <div>{{ d.label }}</div>
                                    <div v-if="d.sublabel" class="text-[9px] font-normal text-slate-400 font-mono">{{ d.sublabel }}</div>
                                </div>
                                <!-- Slots -->
                                <template v-for="slot in previewSlots" :key="'s-' + slot.label">
                                    <div class="border-b border-r p-1 text-[10px] font-mono text-slate-500 text-center">
                                        {{ slot.label }}
                                    </div>
                                    <div v-for="d in DAYS" :key="'c-' + d.value + '-' + slot.label"
                                         class="border-b border-r p-0.5 min-h-[38px] relative">
                                        <div v-for="b in blocksAt(g.blocks, d.value, slot.value)" :key="b.id"
                                             class="border rounded px-1 py-0.5 text-[9px] leading-tight"
                                             :class="subjectColorClasses(b)"
                                             :title="blockTooltip(b)">
                                            <div class="font-bold text-slate-800 truncate">
                                                {{ b.subject?.shortName || b.subject?.name || '—' }}
                                            </div>
                                            <div class="text-slate-600 truncate">
                                                {{ preview.groupBy === 'teacher'
                                                    ? (b.group?.name || '—')
                                                    : preview.groupBy === 'place'
                                                    ? (b.teachers?.[0]?.name || '—')
                                                    : (b.teachers?.[0]?.name || '—') }}
                                            </div>
                                            <div class="text-slate-400 truncate font-mono">
                                                {{ preview.groupBy === 'place' ? b.group?.name : b.placeShortName || b.placeName }}
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </section>
                </div>

                <footer class="px-5 py-3 border-t bg-slate-50 flex items-center justify-end gap-2">
                    <button type="button"
                            class="px-4 py-2 text-xs font-bold rounded border border-slate-300 text-slate-700 hover:bg-slate-100 uppercase"
                            @click="closePreview">
                        Cerrar
                    </button>
                    <button v-if="preview.data?.status === 'ready'"
                            type="button"
                            :disabled="busyRunId === preview.runId"
                            class="px-4 py-2 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700 uppercase disabled:opacity-60"
                            @click="promote(preview.runId!); closePreview()">
                        Promover este borrador
                    </button>
                </footer>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type {
    GenerateRunRequest, GenerateRunResponse, PromoteRunResponse,
    RunListItem, RunStatus, WeightKey,
} from '@/modules/schedules/types/scheduleGeneration.type'
import {
    WEIGHT_KEYS, WEIGHT_LABELS, STATUS_LABELS, STATUS_CLASSES,
} from '@/modules/schedules/types/scheduleGeneration.type'

const TERMINAL_STATUSES: RunStatus[] = [
    'ready', 'infeasible', 'timeout', 'error', 'discarded', 'promoted',
]
const POLL_INTERVAL_MS = 3000

const props = defineProps<{
    open: boolean
    configId: number
    careerId: number
    careerLabel?: string
    campusLabel?: string
    modalityTypeLabel?: string
    /** Slots posibles del día según modalidad (HH:mm). Si se pasan, el grid los
     *  muestra siempre, aunque el solver no haya puesto nada en alguno. */
    daySlots?: string[]
}>()
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'promoted', runId: number): void
}>()

const weightKeys = WEIGHT_KEYS
const weightLabels = WEIGHT_LABELS
const statusLabels = STATUS_LABELS
const statusClasses = STATUS_CLASSES

const form = reactive({
    timeoutSeconds: 120,
    countDrafts: 1,
    decomposeBySemester: false,
    weights: Object.fromEntries(WEIGHT_KEYS.map(k => [k, 0])) as Record<WeightKey, number>,
})
// Default: 2 pesos activos moderados
form.weights.preferShift = 5
form.weights.minimizeTeacherGaps = 7

const saving     = ref(false)
const loadingRuns = ref(false)
const runs        = ref<RunListItem[]>([])
const busyRunId   = ref<number | null>(null)
const conflictsByRun = reactive<Record<number, Record<number, Record<string, string>>>>({})
const msg         = reactive<{ ok: boolean; message: string }>({ ok: true, message: '' })

/* ── Preview de borrador ──────────────────────────────────────── */
interface DraftBlock {
    id: number
    teacherAssignmentId: number
    placeId: number
    placeName: string | null
    placeShortName: string | null
    dayOfWeek: number | null
    date: string | null
    startTime: string
    endTime: string
    subject: { name: string; shortName: string | null } | null
    group: { name: string; shift: string | null } | null
    teachers: Array<{ id: number; name: string; role: string; isVacancy: boolean }>
}

const preview = reactive<{
    runId: number | null
    loading: boolean
    data: { status: RunStatus; drafts: DraftBlock[]; solutionSummary: any } | null
    groupBy: 'group' | 'teacher' | 'place'
}>({ runId: null, loading: false, data: null, groupBy: 'group' })

// Catálogo ISO-8601: Monday=1..Sunday=7.
const DOW_LABELS: Record<number, string> = { 1: 'LUN', 2: 'MAR', 3: 'MIÉ', 4: 'JUE', 5: 'VIE', 6: 'SÁB', 7: 'DOM' }

interface PreviewColumn {
    /** Valor a matchear contra cada bloque. dayOfWeek (int) en modo dow, date (string YYYY-MM-DD) en modo date. */
    value: number | string
    label: string
    sublabel?: string
}

/**
 * Modo del eje X del grid:
 * - 'date' cuando los bloques traen fecha concreta (modalidades por fecha:
 *   sabatino, dominical, maestrías). Cada fecha ocupa su propia columna.
 * - 'dow' cuando sólo traen dayOfWeek (modalidad escolarizada semanal).
 */
const previewAxisMode = computed<'date' | 'dow'>(() => {
    const drafts = preview.data?.drafts ?? []
    const anyDate = drafts.some(b => !!b.date)
    return anyDate ? 'date' : 'dow'
})

/**
 * Columnas del grid.
 * - Modo 'date': columnas ordenadas por fecha ascendente, con label "SÁB 07/FEB".
 * - Modo 'dow': columnas de la semana laboral o sólo los días usados si hay sab/dom.
 */
const DAYS = computed<PreviewColumn[]>(() => {
    const drafts = preview.data?.drafts ?? []
    if (!drafts.length) {
        return [1, 2, 3, 4, 5].map(v => ({ value: v, label: DOW_LABELS[v] }))
    }

    if (previewAxisMode.value === 'date') {
        const uniqueDates = Array.from(new Set(drafts.map(b => b.date).filter((d): d is string => !!d))).sort()
        return uniqueDates.map(dateStr => {
            const d = new Date(dateStr + 'T00:00:00')
            const dow = ((d.getDay() + 6) % 7) + 1  // JS getDay(): 0=Sun..6=Sat → ISO 1..7
            const dd = String(d.getDate()).padStart(2, '0')
            const mm = d.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase().replace('.', '')
            return {
                value: dateStr,
                label: DOW_LABELS[dow] ?? '',
                sublabel: `${dd}/${mm}`,
            }
        })
    }

    const used = new Set<number>()
    for (const b of drafts) {
        if (b.dayOfWeek != null) used.add(b.dayOfWeek)
    }
    const hasWeekend = used.has(6) || used.has(7)
    const pool = hasWeekend ? [1, 2, 3, 4, 5, 6, 7].filter(v => used.has(v)) : [1, 2, 3, 4, 5]
    return pool.map(v => ({ value: v, label: DOW_LABELS[v] }))
})

async function openPreview(runId: number) {
    preview.runId = runId
    preview.loading = true
    preview.data = null
    try {
        const { data } = await api.get(API.SCHEDULES_API.generation.showRun(runId))
        preview.data = {
            status: data.status,
            drafts: (data.drafts ?? []) as DraftBlock[],
            solutionSummary: data.solutionSummary,
        }
    } catch (e: any) {
        flash(false, e?.response?.data?.message || 'Error al cargar el borrador.')
        preview.runId = null
    } finally {
        preview.loading = false
    }
}

function closePreview() {
    preview.runId = null
    preview.data = null
}

const previewSlots = computed(() => {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const starts = new Set<string>()
    // Primero, los slots posibles del día (si el padre los pasó).
    // Asegura filas vacías visibles cuando el solver no puso nada en uno.
    for (const t of props.daySlots ?? []) starts.add(normalizeTime(t))
    // Luego los startTime reales de los drafts (por si el solver produjo
    // slots fuera del grid configurado, que igual deben verse).
    for (const b of preview.data?.drafts ?? []) starts.add(normalizeTime(b.startTime))
    const sorted = [...starts].sort()
    return sorted.map(t => ({ label: t, value: toMin(t) }))
})

function normalizeTime(t: string): string {
    // Backend manda "08:00:00" (DB TIME), el prop viene "08:00". Unificamos a HH:mm.
    return t.length >= 5 ? t.slice(0, 5) : t
}

const previewGridStyle = computed(() => ({
    gridTemplateColumns: `80px repeat(${DAYS.value.length}, 1fr)`,
}))

const previewGroups = computed(() => {
    if (!preview.data) return []
    const map = new Map<string, { key: string; label: string; sortOrder: number; blocks: DraftBlock[] }>()
    for (const b of preview.data.drafts) {
        let key = ''
        let label = ''
        if (preview.groupBy === 'group') {
            key = `g-${b.group?.name ?? 'sin-grupo'}`
            label = b.group?.name ?? 'Sin grupo'
        } else if (preview.groupBy === 'teacher') {
            const main = b.teachers?.[0]
            key = `t-${main?.id ?? 'x'}`
            label = main?.name ?? 'Sin docente'
        } else {
            key = `p-${b.placeId}`
            label = b.placeName ?? `Aula #${b.placeId}`
        }
        if (!map.has(key)) {
            map.set(key, { key, label, sortOrder: 0, blocks: [] })
        }
        map.get(key)!.blocks.push(b)
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
})

function blocksAt(blocks: DraftBlock[], colValue: number | string, slotMin: number): DraftBlock[] {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    if (previewAxisMode.value === 'date') {
        return blocks.filter(b => b.date === colValue && toMin(b.startTime) === slotMin)
    }
    return blocks.filter(b => b.dayOfWeek === colValue && toMin(b.startTime) === slotMin)
}

// Paleta fija de pares (bg + border) para diferenciar materias. Tailwind JIT
// escanea strings literales; por eso las clases están escritas completas.
const SUBJECT_PALETTE = [
    'bg-amber-100 border-amber-300',
    'bg-emerald-100 border-emerald-300',
    'bg-sky-100 border-sky-300',
    'bg-rose-100 border-rose-300',
    'bg-violet-100 border-violet-300',
    'bg-orange-100 border-orange-300',
    'bg-teal-100 border-teal-300',
    'bg-fuchsia-100 border-fuchsia-300',
    'bg-lime-100 border-lime-300',
    'bg-indigo-100 border-indigo-300',
    'bg-cyan-100 border-cyan-300',
    'bg-pink-100 border-pink-300',
]

function subjectColorClasses(b: DraftBlock): string {
    const key = b.subject?.name ?? b.subject?.shortName ?? ''
    if (!key) return SUBJECT_PALETTE[0]
    // Hash determinístico simple (djb2) → índice estable por materia
    let h = 5381
    for (let i = 0; i < key.length; i++) h = ((h << 5) + h) + key.charCodeAt(i)
    return SUBJECT_PALETTE[Math.abs(h) % SUBJECT_PALETTE.length]
}

function blockTooltip(b: DraftBlock): string {
    const subj = b.subject?.name ?? ''
    const teacher = b.teachers?.map(t => t.name).join(', ') ?? ''
    const group = b.group?.name ?? ''
    const place = b.placeName ?? ''
    return `${subj}\n${teacher}\n${group} · ${place}\n${b.startTime} - ${b.endTime}`
}

function flash(ok: boolean, message: string) {
    msg.ok = ok; msg.message = message
    setTimeout(() => { msg.message = '' }, 5000)
}

function close() { emit('close') }

function isTerminal(status: RunStatus): boolean {
    return TERMINAL_STATUSES.includes(status)
}

/* ── Diagnóstico INFEASIBLE (F7.b) ─────────────────────────────── */
const DIAGNOSTIC_LABELS: Record<string, string> = {
    insufficient_places:         'Aulas insuficientes',
    teacher_overloaded:          'Docente sobrecargado',
    subject_restriction_conflict:'Restricciones bloquean la materia',
    missing_allowed_place:       'Sin aula permitida',
    modality_rule_conflict:      'Regla de modalidad violada',
    capacity_overflow:           'Capacidad insuficiente',
    empty_time_grid:             'Calendario vacío',
    unknown:                     'Sin solución factible',
    exception:                   'Error interno',
}

function diagnosticLabel(reason: string): string {
    return DIAGNOSTIC_LABELS[reason] || reason
}

// Campos que NO mostrar como detalle estructurado (ya se renderizan aparte)
const SKIP_FIELDS = new Set(['message', 'hint'])

function detailFields(details: Record<string, unknown> | null | undefined): Record<string, unknown> {
    if (!details || typeof details !== 'object') return {}
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(details)) {
        if (SKIP_FIELDS.has(k)) continue
        if (v === null || v === undefined) continue
        out[k] = v
    }
    return out
}

function hasDetailFields(details: Record<string, unknown> | null | undefined): boolean {
    return Object.keys(detailFields(details)).length > 0
}

function formatFieldLabel(key: string): string {
    // snake_case / camelCase → Capitalizado
    return key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/^./, c => c.toUpperCase())
}

function formatFieldValue(v: unknown): string {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
}

function formatDate(s: string | null) {
    if (!s) return '—'
    const d = new Date(s)
    return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

/* ── Reloj para contador + barra de progreso ────────────────────── */
const nowTick = ref(Date.now())
let clockTimer: ReturnType<typeof setInterval> | null = null

function ensureClock() {
    if (hasRunningRuns.value && clockTimer === null) {
        clockTimer = setInterval(() => { nowTick.value = Date.now() }, 1000)
    } else if (!hasRunningRuns.value && clockTimer !== null) {
        clearInterval(clockTimer); clockTimer = null
    }
}

function elapsedSecondsFor(r: RunListItem): number {
    if (!r.startedAt) return 0
    const start = new Date(r.startedAt).getTime()
    const end   = r.finishedAt ? new Date(r.finishedAt).getTime() : nowTick.value
    return Math.max(0, Math.floor((end - start) / 1000))
}

function elapsedLabel(r: RunListItem): string {
    return elapsedSecondsFor(r) + 's'
}

function progressPct(r: RunListItem): number {
    if (!r.startedAt) return 0
    if (isTerminal(r.status)) return 100
    const timeout = r.timeoutSeconds ?? 0
    if (timeout <= 0) return 0
    const pct = (elapsedSecondsFor(r) / timeout) * 100
    return Math.max(2, Math.min(100, pct))
}

function progressBarClass(r: RunListItem): string {
    if (r.status === 'ready')     return 'bg-emerald-500'
    if (r.status === 'promoted')  return 'bg-emerald-600'
    if (r.status === 'infeasible' || r.status === 'error') return 'bg-red-500'
    if (r.status === 'timeout')   return 'bg-amber-500'
    if (r.status === 'discarded') return 'bg-slate-400'
    return 'bg-blue-500'
}

/* ── Sonido al terminar un run ──────────────────────────────────── */
let audioCtx: AudioContext | null = null
function playDoneSound(success: boolean) {
    try {
        if (!audioCtx) {
            const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
            if (!Ctx) return
            audioCtx = new Ctx() as AudioContext
        }
        const ctx = audioCtx
        const now = ctx.currentTime
        const freqs = success ? [784, 1175] : [440, 330] // sol/re para ok, la/mi descendente para fallo
        freqs.forEach((f, i) => {
            const t = now + i * 0.14
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.value = f
            osc.connect(gain); gain.connect(ctx.destination)
            gain.gain.setValueAtTime(0.0001, t)
            gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
            osc.start(t); osc.stop(t + 0.3)
        })
    } catch { /* audio no disponible, silencio */ }
}

const prevStatuses = new Map<number, RunStatus>()
watch(runs, (newRuns) => {
    for (const r of newRuns) {
        const prev = prevStatuses.get(r.id)
        if (prev !== undefined && !TERMINAL_STATUSES.includes(prev) && TERMINAL_STATUSES.includes(r.status)) {
            playDoneSound(r.status === 'ready')
        }
        prevStatuses.set(r.id, r.status)
    }
    ensureClock()
}, { deep: true })

/* ── Polling async ─────────────────────────────────────────────── */
let pollTimer: ReturnType<typeof setTimeout> | null = null

const hasRunningRuns = computed(() =>
    runs.value.some(r => !TERMINAL_STATUSES.includes(r.status))
)

async function loadRuns(silent = false) {
    if (!silent) loadingRuns.value = true
    try {
        const { data } = await api.get(API.SCHEDULES_API.generation.listRuns, {
            params: { config_id: props.configId, career_id: props.careerId, limit: 20 },
        })
        runs.value = Array.isArray(data) ? data : []
    } catch (e: any) {
        if (!silent) flash(false, e?.response?.data?.message || 'Error al listar borradores.')
    } finally {
        if (!silent) loadingRuns.value = false
    }
    schedulePollIfNeeded()
}

function schedulePollIfNeeded() {
    clearPoll()
    if (!props.open) return
    if (!hasRunningRuns.value) return
    pollTimer = setTimeout(() => loadRuns(true), POLL_INTERVAL_MS)
}

function clearPoll() {
    if (pollTimer !== null) {
        clearTimeout(pollTimer)
        pollTimer = null
    }
}

async function generate() {
    saving.value = true
    try {
        const payload: GenerateRunRequest = {
            academic_load_config_id: props.configId,
            career_id:               props.careerId,
            weights:                 filterNonZeroWeights(form.weights),
            count_drafts:            form.countDrafts,
            timeout_seconds:         form.timeoutSeconds,
            decompose_by_semester:   form.decomposeBySemester,
        }
        const { data } = await api.post<GenerateRunResponse>(API.SCHEDULES_API.generation.createRun, payload)

        const summary = data.runs.map(r => `#${r.id}:${r.status}`).join(', ')
        flash(true, `Corridas encoladas: ${summary}. Procesándose…`)
        await loadRuns()
    } catch (e: any) {
        const status = e?.response?.status
        const serverMsg = e?.response?.data?.message
        if (status === 429) {
            // F7.e — rate limit del college
            flash(false, serverMsg || 'Límite de corridas alcanzado para este college.')
        } else {
            flash(false, serverMsg || 'Error al disparar la generación.')
        }
    } finally {
        saving.value = false
    }
}

function filterNonZeroWeights(w: Record<WeightKey, number>): Record<string, number> {
    const out: Record<string, number> = {}
    for (const k of WEIGHT_KEYS) if (w[k] > 0) out[k] = w[k]
    return out
}

async function promote(runId: number) {
    busyRunId.value = runId
    delete conflictsByRun[runId]
    try {
        const { data } = await api.post<PromoteRunResponse>(API.SCHEDULES_API.generation.promote(runId))
        flash(true, `Promovido: ${data.promoted} bloques al horario.`)
        emit('promoted', runId)
        await loadRuns()
    } catch (e: any) {
        if (e?.response?.status === 409 && e?.response?.data?.conflicts) {
            conflictsByRun[runId] = e.response.data.conflicts
            flash(false, e.response.data.message || 'Conflictos al promover.')
        } else {
            flash(false, e?.response?.data?.message || 'Error al promover.')
        }
    } finally {
        busyRunId.value = null
    }
}

async function discard(runId: number) {
    busyRunId.value = runId
    try {
        await api.delete(API.SCHEDULES_API.generation.discard(runId))
        flash(true, `Borrador #${runId} descartado.`)
        await loadRuns()
    } catch (e: any) {
        flash(false, e?.response?.data?.message || 'Error al descartar.')
    } finally {
        busyRunId.value = null
    }
}

async function deleteRun(r: RunListItem) {
    // Para runs promoted el usuario pierde el historial de qué run generó
    // los bloques activos, aunque el horario en sí no se toque. Pedimos
    // confirmación explícita; para los demás estados terminales no.
    if (r.status === 'promoted') {
        const ok = window.confirm(
            `El borrador #${r.id} ya fue promovido. Borrarlo solo elimina el registro histórico; los bloques en el horario activo permanecen sin cambios.\n\n¿Continuar?`,
        )
        if (!ok) return
    }
    await discard(r.id)
}

// immediate: true → el drawer se monta con v-if y al montar props.open ya
// es true; sin immediate el watch no dispararía hasta el siguiente cambio,
// dejando al usuario sin ver un run activo existente hasta refrescar.
watch(() => props.open, (isOpen) => {
    if (isOpen) {
        loadRuns()
    } else {
        clearPoll()
        if (clockTimer !== null) { clearInterval(clockTimer); clockTimer = null }
    }
}, { immediate: true })

// Si cambia el config/career del drawer (ej: el director cierra y abre
// con otra carrera), detenemos el polling anterior y recargamos.
watch(() => [props.configId, props.careerId], () => {
    if (props.open) loadRuns()
})

onBeforeUnmount(() => {
    clearPoll()
    if (clockTimer !== null) { clearInterval(clockTimer); clockTimer = null }
})
</script>
