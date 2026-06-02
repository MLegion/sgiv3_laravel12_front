<template>
    <WidgetPeriodSettings
        v-if="view === 'settings'"
        :periods="data?.availablePeriods ?? []"
        @params="$emit('params', $event)"
    />

    <div v-else class="h-full flex flex-col text-xs gap-3 overflow-auto">
        <div v-if="loading && !data" class="flex-1 grid place-items-center text-slate-400">Cargando…</div>
        <div v-else-if="error" class="flex-1 grid place-items-center text-rose-500">Error al cargar.</div>
        <div v-else-if="!data" class="flex-1 grid place-items-center text-slate-400">Sin datos.</div>

        <template v-else>
            <section>
                <h4 class="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Edad</h4>
                <WidgetBars v-if="ageItems.length" :items="ageItems" />
                <p v-else class="text-slate-300">Sin fechas de nacimiento.</p>
            </section>
            <section>
                <h4 class="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Sexo</h4>
                <WidgetBars :items="sexItems" />
            </section>
            <section>
                <h4 class="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Modalidad de examen</h4>
                <WidgetBars :items="modeItems" />
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WidgetPeriodSettings from './_shared/WidgetPeriodSettings.vue'
import WidgetBars from './_shared/WidgetBars.vue'

interface AgeBucket { label: string; count: number }
interface KeyBucket { key: string; label: string; count: number }
interface Period { id: number; name: string; shortName: string | null }
interface Payload {
    age:  { buckets: AgeBucket[] }
    sex:  { buckets: KeyBucket[] }
    mode: { buckets: KeyBucket[] }
    availablePeriods: Period[]
}

const props = defineProps<{ data: Payload | null; loading: boolean; error: unknown; view?: 'data' | 'settings' }>()
defineEmits<{ (e: 'params', p: Record<string, unknown>): void }>()

const SEX_COLOR: Record<string, string>  = { M: 'bg-blue-500', F: 'bg-pink-500', NULL: 'bg-slate-400' }
const MODE_COLOR: Record<string, string> = { online: 'bg-blue-500', presencial: 'bg-purple-500', NULL: 'bg-slate-400' }

const ageItems  = computed(() => (props.data?.age.buckets ?? []).map(b => ({ label: b.label, count: b.count, color: 'bg-indigo-500' })))
const sexItems  = computed(() => (props.data?.sex.buckets ?? []).map(b => ({ key: b.key, label: b.label, count: b.count, color: SEX_COLOR[b.key] ?? 'bg-slate-400' })))
const modeItems = computed(() => (props.data?.mode.buckets ?? []).map(b => ({ key: b.key, label: b.label, count: b.count, color: MODE_COLOR[b.key] ?? 'bg-slate-400' })))
</script>
