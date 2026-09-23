<template>
    <div class="flex items-end gap-4 flex-wrap">
        <div class="flex flex-col">
            <label v-if="label" :for="id" class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{{ label }}</label>
            <select
                :id="id"
                :value="modelValue"
                :disabled="disabled"
                class="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[16rem] disabled:opacity-60"
                @change="onChange"
            >
                <option :value="null" disabled>Selecciona un periodo…</option>
                <option v-for="p in visiblePeriods" :key="p.id" :value="p.id">{{ optionLabel(p) }}</option>
            </select>
        </div>
        <label class="inline-flex items-center gap-2 text-xs text-slate-600 select-none pb-1.5 cursor-pointer">
            <input type="checkbox" v-model="showArchived" class="rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
            Mostrar periodos archivados
        </label>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface PeriodOption {
    id: number
    status?: string | null
    academicPeriod?: { name?: string | null; shortName?: string | null } | null
}

const props = withDefaults(defineProps<{
    modelValue: number | null
    periods: PeriodOption[]
    disabled?: boolean
    label?: string
}>(), {
    disabled: false,
    label: 'Periodo',
})

const emit = defineEmits<{
    (e: 'update:modelValue', v: number | null): void
    (e: 'change', v: number | null): void
}>()

const id = `evd-period-${Math.random().toString(36).slice(2, 8)}`

// Por defecto se ocultan los periodos archivados; el checkbox los revela.
const showArchived = ref(false)

const visiblePeriods = computed(() =>
    showArchived.value
        ? props.periods
        : props.periods.filter(p => (p.status ?? '') !== 'archived'),
)

function optionLabel(p: PeriodOption): string {
    const base = p.academicPeriod?.name ?? p.academicPeriod?.shortName ?? `Periodo #${p.id}`
    return (p.status ?? '') === 'archived' ? `${base} (archivado)` : base
}

function onChange(e: Event) {
    const v = (e.target as HTMLSelectElement).value
    const val = v === '' ? null : Number(v)
    emit('update:modelValue', val)
    emit('change', val)
}

// Si el periodo seleccionado deja de estar visible (p.ej. se desmarca "archivados"
// y estaba archivado), se reemplaza por el primer periodo visible.
watch([() => props.periods, showArchived], () => {
    if (props.modelValue != null && !visiblePeriods.value.some(p => p.id === props.modelValue)) {
        emit('update:modelValue', visiblePeriods.value[0]?.id ?? null)
    }
})
</script>
