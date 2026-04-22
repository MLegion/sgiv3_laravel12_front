<template>
    <teleport to="body">
        <div v-if="open" class="fixed inset-0 z-[60]">
            <div class="absolute inset-0 bg-black/40" @click="close"></div>

            <aside class="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
                <header class="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 class="text-lg font-semibold text-slate-800 uppercase tracking-wide">Generación Automática</h2>
                        <p class="text-xs text-slate-500 mt-0.5">Carrera: <b>{{ careerLabel || `#${careerId}` }}</b></p>
                    </div>
                    <button type="button" class="text-slate-400 hover:text-slate-700 text-xl" @click="close">×</button>
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
                            @click="loadRuns">↻ Refrescar</button>
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
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                                            :class="statusClasses[r.status]">{{ statusLabels[r.status] }}</span>
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
                                    <p v-if="r.solutionSummary?.diagnostics?.reason" class="text-[10px] text-red-600 mt-1">
                                        {{ r.solutionSummary.diagnostics.reason }}
                                    </p>
                                </div>
                                <div class="flex gap-2 flex-shrink-0">
                                    <button v-if="r.status === 'ready'"
                                        :disabled="busyRunId === r.id"
                                        class="px-3 py-1.5 text-[10px] font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700 uppercase disabled:opacity-60"
                                        @click="promote(r.id)">
                                        Promover
                                    </button>
                                    <button v-if="r.status !== 'promoted' && r.status !== 'discarded'"
                                        :disabled="busyRunId === r.id"
                                        class="px-3 py-1.5 text-[10px] font-bold rounded border border-slate-300 text-slate-700 hover:bg-slate-100 uppercase disabled:opacity-60"
                                        @click="discard(r.id)">
                                        Descartar
                                    </button>
                                </div>
                            </header>

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
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type {
    GenerateRunRequest, GenerateRunResponse, PromoteRunResponse,
    RunListItem, WeightKey,
} from '@/modules/schedules/types/scheduleGeneration.type'
import {
    WEIGHT_KEYS, WEIGHT_LABELS, STATUS_LABELS, STATUS_CLASSES,
} from '@/modules/schedules/types/scheduleGeneration.type'

const props = defineProps<{
    open: boolean
    configId: number
    careerId: number
    careerLabel?: string
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

function flash(ok: boolean, message: string) {
    msg.ok = ok; msg.message = message
    setTimeout(() => { msg.message = '' }, 5000)
}

function close() { emit('close') }

function formatDate(s: string | null) {
    if (!s) return '—'
    const d = new Date(s)
    return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

async function loadRuns() {
    loadingRuns.value = true
    try {
        const { data } = await api.get(API.SCHEDULES_API.generation.listRuns, {
            params: { config_id: props.configId, career_id: props.careerId, limit: 20 },
        })
        runs.value = Array.isArray(data) ? data : []
    } catch (e: any) {
        flash(false, e?.response?.data?.message || 'Error al listar borradores.')
    } finally {
        loadingRuns.value = false
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
        }
        const { data } = await api.post<GenerateRunResponse>(API.SCHEDULES_API.generation.createRun, payload)

        const summary = data.runs.map(r => `#${r.id}:${r.status}`).join(', ')
        flash(true, `Corridas creadas: ${summary}`)
        await loadRuns()
    } catch (e: any) {
        flash(false, e?.response?.data?.message || 'Error al disparar la generación.')
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

watch(() => props.open, (isOpen) => {
    if (isOpen) loadRuns()
})
</script>
