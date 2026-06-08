<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

interface Career { id: number; name: string; short_name: string | null }
interface BehindGroup {
    teacher_assignment_id: number
    subject: { id: number; name: string; official_code: string | null }
    group: { id: number; name: string | null }
    career: { id: number; name: string; short_name: string | null }
    pending_assignments: number
    total_assignments: number
    progress_pct: number
}
interface NamedRef { id: number; name: string }
interface Payload {
    period: { id: number; name: string; short_name: string | null } | null
    cap_id: number | null
    career_scoped: boolean
    careers: Career[]
    campuses: NamedRef[]
    modality_types: NamedRef[]
    summary: { total: number; completed: number; pending: number; progress_pct: number; groups_count: number }
    top_behind: BehindGroup[]
}

const props = defineProps<{
    data:    Payload | null
    loading: boolean
    error:   unknown
    view?:   'data' | 'settings'
}>()

const router = useRouter()

const summary    = computed(() => props.data?.summary ?? { total: 0, completed: 0, pending: 0, progress_pct: 0, groups_count: 0 })
const topBehind  = computed(() => props.data?.top_behind ?? [])
const careers    = computed(() => props.data?.careers ?? [])
const campuses   = computed(() => props.data?.campuses ?? [])
const modalities = computed(() => props.data?.modality_types ?? [])
const hasData    = computed(() => summary.value.total > 0)

const campusLabel   = computed(() => campuses.value.map(c => c.name).join(', '))
const modalityLabel = computed(() => modalities.value.map(m => m.name).join(', '))

// Alcance de lo mostrado: por carrera (jefe) o global (director/SES).
const scope = computed<{ label: string; cls: string }>(() => {
    if (props.data?.career_scoped) {
        const cs = careers.value
        if (cs.length === 1) return { label: cs[0].short_name ?? cs[0].name, cls: 'bg-indigo-100 text-indigo-700' }
        if (cs.length > 1)   return { label: `${cs.length} carreras`, cls: 'bg-indigo-100 text-indigo-700' }
        return { label: 'Mi carrera', cls: 'bg-indigo-100 text-indigo-700' }
    }
    return { label: 'Global · todas las carreras', cls: 'bg-slate-100 text-slate-600' }
})

function barColor(pct: number): string {
    if (pct >= 80) return 'bg-emerald-500'
    if (pct >= 50) return 'bg-amber-500'
    return 'bg-rose-500'
}

function goDetail() {
    router.push({ name: 'evd.career-progress' })
}
</script>

<template>
    <div class="h-full flex flex-col text-xs">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold" :class="scope.cls">{{ scope.label }}</span>
            <span v-if="data?.period" class="text-[9px] text-slate-500 ml-auto">
                {{ data.period.short_name ?? data.period.name }}
            </span>
        </div>

        <div v-if="loading && !data" class="text-slate-400 italic">Cargando…</div>

        <div v-else-if="!hasData" class="text-slate-500 italic text-[11px] flex-1 flex items-center justify-center text-center">
            Sin evaluación docente activa para tu carrera en el periodo.
        </div>

        <div v-else class="flex-1 flex flex-col gap-2 min-h-0">
            <!-- Resumen global -->
            <div>
                <div class="flex items-end justify-between mb-1">
                    <div>
                        <span class="text-2xl font-bold tabular-nums text-slate-800">{{ summary.progress_pct }}%</span>
                        <span class="text-[10px] text-slate-500 ml-1">completado</span>
                    </div>
                    <div class="text-[10px] text-slate-500 text-right">
                        <span class="font-semibold text-emerald-600">{{ summary.completed }}</span> /
                        {{ summary.total }} evaluaciones
                        <div v-if="summary.pending > 0" class="text-rose-500">{{ summary.pending }} pendientes</div>
                    </div>
                </div>
                <div class="h-2 bg-slate-100 rounded overflow-hidden">
                    <div class="h-full transition-all" :class="barColor(summary.progress_pct)" :style="{ width: summary.progress_pct + '%' }"></div>
                </div>
                <div v-if="careers.length > 1" class="mt-1 flex flex-wrap gap-1">
                    <span v-for="c in careers" :key="c.id"
                          class="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {{ c.short_name ?? c.name }}
                    </span>
                </div>
                <div v-if="campusLabel || modalityLabel" class="mt-1 space-y-0.5 text-[9px] text-slate-500">
                    <div v-if="campusLabel"><span class="font-semibold text-slate-400 uppercase">Campus:</span> {{ campusLabel }}</div>
                    <div v-if="modalityLabel"><span class="font-semibold text-slate-400 uppercase">Modalidad:</span> {{ modalityLabel }}</div>
                </div>
            </div>

            <!-- Grupos más atrasados -->
            <div v-if="topBehind.length" class="flex-1 min-h-0 overflow-y-auto">
                <div class="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">Grupos más atrasados</div>
                <ul class="space-y-1">
                    <li v-for="g in topBehind" :key="g.teacher_assignment_id"
                        class="flex items-center gap-2 border border-slate-100 rounded px-2 py-1">
                        <div class="min-w-0 flex-1">
                            <div class="truncate text-[11px] font-medium text-slate-700">{{ g.subject.name }}</div>
                            <div class="text-[9px] text-slate-500">
                                {{ g.group.name ?? '—' }}
                                <span v-if="careers.length > 1"> · {{ g.career.short_name ?? g.career.name }}</span>
                            </div>
                        </div>
                        <div class="text-right shrink-0">
                            <div class="text-[11px] font-bold tabular-nums"
                                 :class="g.progress_pct >= 50 ? 'text-amber-600' : 'text-rose-600'">{{ g.progress_pct }}%</div>
                            <div class="text-[9px] text-slate-400">{{ g.pending_assignments }} faltan</div>
                        </div>
                    </li>
                </ul>
            </div>
            <div v-else class="flex-1 flex items-center justify-center text-[11px] text-emerald-600 italic">
                ✓ Todos los grupos completados.
            </div>

            <!-- Acceso al detalle -->
            <button type="button"
                class="mt-auto w-full text-center text-[11px] font-semibold text-blue-600 hover:text-blue-700 border-t border-slate-100 pt-1.5"
                @click="goDetail">
                Ver avance por grupos →
            </button>
        </div>
    </div>
</template>
