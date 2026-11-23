<template>
    <WidgetPeriodSettings
        v-if="view === 'settings'"
        :periods="data?.availablePeriods ?? []"
        @params="$emit('params', $event)"
    />

    <div v-else class="h-full flex flex-col text-xs">
        <div v-if="loading && !data" role="status" class="flex-1 min-h-0">
            <span class="sr-only">Cargando…</span>
            <div aria-hidden="true" class="flex flex-col gap-2.5 pt-1">
                <div v-for="n in 4" :key="n" class="space-y-1">
                    <div class="h-2.5 w-1/3 rounded bg-slate-200 animate-pulse motion-reduce:animate-none"></div>
                    <div class="h-2.5 w-full rounded bg-slate-200 animate-pulse motion-reduce:animate-none"></div>
                </div>
            </div>
        </div>
        <div v-else-if="error" class="flex-1 grid place-items-center text-rose-500">Error al cargar.</div>
        <div v-else-if="!data || data.careers.length === 0" class="flex-1 grid place-items-center text-slate-400 text-center px-4">
            Sin aspirantes con oferta elegida en este periodo.
        </div>

        <template v-else>
            <p class="text-[10px] text-slate-400 mb-2">Demanda como 1ª opción (sub: 1ª·2ª·3ª).</p>
            <div class="flex-1 min-h-0 overflow-auto">
                <WidgetBars :items="careers" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WidgetPeriodSettings from './_shared/WidgetPeriodSettings.vue'
import WidgetBars from './_shared/WidgetBars.vue'

interface Career { careerId: number; name: string; opt1: number; opt2: number; opt3: number; total: number }
interface Period { id: number; name: string; shortName: string | null }
interface Payload { careers: Career[]; availablePeriods: Period[] }

const props = defineProps<{ data: Payload | null; loading: boolean; error: unknown; view?: 'data' | 'settings' }>()
defineEmits<{ (e: 'params', p: Record<string, unknown>): void }>()

// Ordenadas por 1ª opción; barra proporcional a opt1.
const careers = computed(() =>
    [...(props.data?.careers ?? [])]
        .sort((a, b) => b.opt1 - a.opt1)
        .map(c => ({ key: c.careerId, label: c.name, count: c.opt1, sub: `${c.opt1}·${c.opt2}·${c.opt3}` })),
)
</script>
