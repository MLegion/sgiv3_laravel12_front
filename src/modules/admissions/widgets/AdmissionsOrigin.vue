<template>
    <WidgetPeriodSettings
        v-if="view === 'settings'"
        :periods="data?.availablePeriods ?? []"
        @params="$emit('params', $event)"
    />

    <div v-else class="h-full flex flex-col text-xs gap-3 overflow-auto">
        <div v-if="loading && !data" class="flex-1 grid place-items-center text-slate-400">Cargando…</div>
        <div v-else-if="error" class="flex-1 grid place-items-center text-rose-500">Error al cargar.</div>
        <div v-else-if="!data || (!topSchools.length && !byState.length)" class="flex-1 grid place-items-center text-slate-400 text-center px-4">
            Sin datos de procedencia.
        </div>

        <template v-else>
            <section v-if="topSchools.length">
                <h4 class="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Top escuelas de procedencia</h4>
                <WidgetBars :items="topSchools" />
            </section>
            <section v-if="byState.length">
                <h4 class="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Por estado de nacimiento</h4>
                <WidgetBars :items="byState" />
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WidgetPeriodSettings from './_shared/WidgetPeriodSettings.vue'
import WidgetBars from './_shared/WidgetBars.vue'

interface School { schoolId: number; name: string; count: number }
interface State { stateId: number; name: string; count: number }
interface Period { id: number; name: string; shortName: string | null }
interface Payload { topSchools: School[]; byState: State[]; availablePeriods: Period[] }

const props = defineProps<{ data: Payload | null; loading: boolean; error: unknown; view?: 'data' | 'settings' }>()
defineEmits<{ (e: 'params', p: Record<string, unknown>): void }>()

const topSchools = computed(() => (props.data?.topSchools ?? []).slice(0, 8).map(s => ({ key: s.schoolId, label: s.name, count: s.count, color: 'bg-teal-500' })))
const byState    = computed(() => (props.data?.byState ?? []).slice(0, 6).map(s => ({ key: s.stateId, label: s.name, count: s.count, color: 'bg-amber-500' })))
</script>
