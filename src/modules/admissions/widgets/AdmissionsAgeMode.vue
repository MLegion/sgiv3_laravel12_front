<template>
    <!-- SETTINGS: vista por defecto (localStorage) + periodo -->
    <div v-if="view === 'settings'" class="h-full flex flex-col text-xs gap-3">
        <div>
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Vista por defecto</label>
            <select
                v-model="defaultView"
                class="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
                @change="saveDefault"
            >
                <option v-for="o in availableViews" :key="o.key" :value="o.key">{{ o.label }}</option>
            </select>
        </div>
        <WidgetPeriodSettings :periods="data?.availablePeriods ?? []" @params="$emit('params', $event)" />
    </div>

    <!-- DATA: toggle de vista + sección activa -->
    <div v-else class="h-full flex flex-col text-xs">
        <div v-if="loading && !data" class="flex-1 grid place-items-center text-slate-400">Cargando…</div>
        <div v-else-if="error" class="flex-1 grid place-items-center text-rose-500">Error al cargar.</div>
        <div v-else-if="!data" class="flex-1 grid place-items-center text-slate-400">Sin datos.</div>

        <template v-else>
            <div v-if="availableViews.length > 1" class="inline-flex bg-slate-100 rounded-lg p-0.5 mb-3 self-start">
                <button
                    v-for="o in availableViews"
                    :key="o.key"
                    class="px-2.5 py-1 rounded-md transition text-[11px]"
                    :class="effectiveView === o.key ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'"
                    @click="activeView = o.key"
                >
                    {{ o.label }}
                </button>
            </div>

            <div class="flex-1 min-h-0 overflow-auto">
                <!-- Edad -->
                <template v-if="effectiveView === 'age'">
                    <WidgetBars v-if="ageItems.length" :items="ageItems" vertical />
                    <p v-else class="text-slate-300">Sin fechas de nacimiento.</p>
                </template>
                <!-- Sexo -->
                <WidgetBars v-else-if="effectiveView === 'sex'" :items="sexItems" vertical />
                <!-- Modalidad de examen -->
                <WidgetBars v-else :items="modeItems" vertical />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
    examMode?: 'online' | 'presencial' | 'mixto' | null
}

const props = defineProps<{ data: Payload | null; loading: boolean; error: unknown; view?: 'data' | 'settings' }>()
defineEmits<{ (e: 'params', p: Record<string, unknown>): void }>()

type ViewKey = 'age' | 'sex' | 'mode'
const VIEWS: Array<{ key: ViewKey; label: string }> = [
    { key: 'age',  label: 'Edad' },
    { key: 'sex',  label: 'Sexo' },
    { key: 'mode', label: 'Modalidad' },
]

// La vista de modalidad solo aplica en examen mixto; con una sola modalidad permitida
// sería redundante (todos quedan igual), así que se oculta.
const availableViews = computed(() =>
    VIEWS.filter(v => v.key !== 'mode' || props.data?.examMode === 'mixto'),
)

// Preferencia de vista por defecto, persistida en localStorage (config del widget).
const STORAGE_KEY = 'widget:adm.stats.age-mode:defaultView'
function readDefault(): ViewKey {
    if (typeof window === 'undefined') return 'age'
    const v = window.localStorage.getItem(STORAGE_KEY)
    return (v === 'sex' || v === 'mode') ? v : 'age'
}
const defaultView = ref<ViewKey>(readDefault())
const activeView  = ref<ViewKey>(defaultView.value)
// Vista realmente mostrada: si la activa no está disponible (p.ej. "mode" sin mixto), cae a edad.
const effectiveView = computed<ViewKey>(() =>
    availableViews.value.some(v => v.key === activeView.value) ? activeView.value : 'age',
)
function saveDefault(): void {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, defaultView.value)
    activeView.value = defaultView.value
}

const SEX_COLOR: Record<string, string>  = { M: 'bg-blue-500', F: 'bg-pink-500', NULL: 'bg-slate-400' }
const MODE_COLOR: Record<string, string> = { online: 'bg-blue-500', presencial: 'bg-purple-500', NULL: 'bg-slate-400' }

const ageItems  = computed(() => (props.data?.age.buckets ?? []).map(b => ({ label: b.label, count: b.count, color: 'bg-indigo-500' })))
const sexItems  = computed(() => (props.data?.sex.buckets ?? []).map(b => ({ key: b.key, label: b.label, count: b.count, color: SEX_COLOR[b.key] ?? 'bg-slate-400' })))
const modeItems = computed(() => (props.data?.mode.buckets ?? []).map(b => ({ key: b.key, label: b.label, count: b.count, color: MODE_COLOR[b.key] ?? 'bg-slate-400' })))
</script>
