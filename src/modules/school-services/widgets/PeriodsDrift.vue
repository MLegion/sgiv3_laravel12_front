<template>
    <div class="h-full flex flex-col text-xs">
        <div class="flex items-center gap-2 mb-2">
            <span class="font-medium text-slate-700">Periodos con drift</span>
            <span v-if="items.length > 0" class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                {{ items.length }}
            </span>
            <button
                v-if="items.length > 1 && !applying"
                class="ml-auto text-[10px] px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                @click="applyAll"
            >Aplicar todos</button>
            <span v-if="applying" class="ml-auto text-[10px] text-slate-500 italic">Aplicando…</span>
        </div>

        <div v-if="loading && !data" class="text-slate-400 italic">Cargando…</div>

        <div v-else-if="items.length === 0" class="text-slate-400 italic">
            ✓ Todos los periodos están en sincronía.
        </div>

        <div v-else class="flex-1 flex flex-col gap-1.5 overflow-y-auto">
            <article
                v-for="(it, idx) in items"
                :key="`${it.scope}-${it.academicPeriodId}-${it.collegeId ?? 'g'}`"
                class="border rounded p-2"
                :class="it.kind === 'blocked' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'"
            >
                <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span
                        class="text-[9px] uppercase font-semibold px-1 py-0.5 rounded"
                        :class="it.scope === 'global' ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'"
                    >{{ it.scope === 'global' ? 'Global' : it.collegeShortName }}</span>
                    <span class="text-[11px] font-semibold text-slate-700">
                        {{ it.academicPeriodShortName ?? it.academicPeriodName }}
                    </span>
                    <span
                        v-if="it.kind === 'blocked'"
                        class="ml-auto text-[9px] uppercase font-semibold px-1 py-0.5 rounded bg-amber-200 text-amber-800"
                    >Bloqueado</span>
                </div>

                <!-- Suggested: transición sugerida con botón Aplicar -->
                <template v-if="it.kind === 'suggested'">
                    <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span class="text-[10px] px-1 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                            {{ it.currentStatus }}
                        </span>
                        <span class="text-slate-400">→</span>
                        <span class="text-[10px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 font-mono">
                            {{ it.suggestedStatus }}
                        </span>
                        <span class="text-[9px] text-slate-500 italic ml-auto">{{ reasonLabel(it.reason) }}</span>
                    </div>
                    <div class="flex items-center gap-1 mt-1">
                        <span class="text-[10px] text-slate-500">
                            {{ it.startDate }} → {{ it.endDate }}
                        </span>
                        <button
                            :disabled="applying || appliedKeys.has(keyOf(it))"
                            class="ml-auto text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300"
                            @click="applyOne(it, idx)"
                        >
                            {{ appliedKeys.has(keyOf(it)) ? 'Aplicado ✓' : 'Aplicar' }}
                        </button>
                    </div>
                </template>

                <!-- Blocked: requiere cierre de carga -->
                <template v-else>
                    <p class="text-[10px] text-amber-900 mb-1">
                        {{ blockedMessage(it) }}
                    </p>
                    <div class="flex items-center gap-1 mt-1">
                        <span class="text-[10px] text-slate-500">
                            {{ it.startDate }} → {{ it.endDate }}
                        </span>
                        <RouterLink
                            v-if="it.collegeAcademicPeriodId"
                            :to="`/school-services/period-closure/${it.collegeAcademicPeriodId}`"
                            class="ml-auto text-[10px] px-2 py-0.5 rounded bg-amber-600 text-white hover:bg-amber-700"
                        >
                            Ver cierre →
                        </RouterLink>
                    </div>
                </template>

                <p v-if="errors[idx]" class="text-[10px] text-rose-600 mt-1">{{ errors[idx] }}</p>
            </article>
        </div>

        <div v-if="error" class="mt-2 text-rose-600 text-[11px]">No se pudo cargar.</div>
        <div v-if="banner" class="mt-2 text-[10px] text-emerald-700 italic">{{ banner }}</div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface DriftItem {
    scope:                   'global' | 'college'
    academicPeriodId:        number
    academicPeriodName:      string
    academicPeriodShortName: string | null
    collegeId:               number | null
    collegeShortName:        string | null
    currentStatus:           string
    suggestedStatus:         string | null
    reason:                  string
    startDate:               string
    endDate:                 string
    statusChangedAt:         string | null
    kind:                    'suggested' | 'blocked'
    collegeAcademicPeriodId: number | null
}

interface Payload {
    collegeId: number | null
    items:     DriftItem[]
}

const props = defineProps<{
    data:    Payload | null
    loading: boolean
    error:   unknown
    view?:   'data' | 'settings'
}>()

const emit = defineEmits<{
    (e: 'refresh'): void
}>()

const items = computed<DriftItem[]>(() => props.data?.items ?? [])
const applying    = ref(false)
const appliedKeys = ref<Set<string>>(new Set())
const errors      = reactive<Record<number, string>>({})
const banner      = ref<string>('')

function keyOf(it: DriftItem): string {
    return `${it.scope}-${it.academicPeriodId}-${it.collegeId ?? 'g'}`
}

function reasonLabel(r: string): string {
    return {
        date_reached:            'fecha alcanzada',
        sca_phase:               'hito SCA',
        manual:                  'manual',
        next_period_active:      'siguiente periodo activo',
        grades_loading_pending:  'cierre carga pendiente',
        other:                   'otro',
    }[r] ?? r
}

function blockedMessage(it: DriftItem): string {
    if (it.reason === 'grades_loading_pending') {
        return 'La fecha del periodo terminó pero falta cerrar formalmente la carga de calificaciones antes de pasar a CLOSED.'
    }
    return 'Transición bloqueada.'
}

async function applyOne(it: DriftItem, idx: number): Promise<void> {
    if (applying.value) return
    applying.value = true
    delete errors[idx]
    try {
        await api.post(API.SCHOOL_SERVICES_API.academicPeriodStatus.apply, {
            scope:              it.scope,
            academic_period_id: it.academicPeriodId,
            college_id:         it.collegeId,
            to_status:          it.suggestedStatus,
            reason:             it.reason,
        })
        appliedKeys.value.add(keyOf(it))
        banner.value = `Aplicado: ${it.academicPeriodShortName ?? it.academicPeriodName} → ${it.suggestedStatus}`
        emit('refresh')
    } catch (e: unknown) {
        const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
            ?? 'Error al aplicar la transición.'
        errors[idx] = msg
    } finally {
        applying.value = false
    }
}

async function applyAll(): Promise<void> {
    if (applying.value) return
    applying.value = true
    try {
        const collegeId = props.data?.collegeId ?? null
        const { data } = await api.post(API.SCHOOL_SERVICES_API.academicPeriodStatus.applyBulk, {
            college_id: collegeId,
        })
        banner.value = `${data.applied} aplicado(s) de ${data.total}. ${data.failed?.length ?? 0} fallido(s).`
        items.value.forEach(it => appliedKeys.value.add(keyOf(it)))
        emit('refresh')
    } catch {
        banner.value = 'Error al aplicar en bulk.'
    } finally {
        applying.value = false
    }
}
</script>
