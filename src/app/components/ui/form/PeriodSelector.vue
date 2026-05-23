<template>
    <div>
        <label v-if="label" class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">{{ label }}</label>
        <select
            :value="modelValue"
            @change="onChange"
            class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase"
            :disabled="loading || disabled"
        >
            <option :value="null">{{ placeholder }}</option>
            <option v-for="p in periods" :key="p.id" :value="p.id">
                {{ p.name }}
                <template v-if="p.statusLabel"> — {{ p.statusLabel }}</template>
            </option>
        </select>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const props = withDefaults(defineProps<{
    modelValue: number | null
    label?: string
    placeholder?: string
    disabled?: boolean
    /**
     * Si se pasa, al terminar de cargar la lista de periodos y si el
     * `modelValue` sigue en `null`, se auto-emite el periodo más reciente
     * cuyo status coincida (p.ej. 'planned' para pantallas de carga
     * académica). Si no hay coincidencia, cae a 'active' como fallback.
     * Pensado para CAREER_MANAGER y similares: entrar a la página ya con
     * un periodo razonable seleccionado.
     */
    autoSelectStatus?: string | null
}>(), {
    label: 'PERIODO ACADÉMICO',
    placeholder: '-- SELECCIONAR PERIODO --',
    disabled: false,
    autoSelectStatus: null,
})

const emit = defineEmits<{
    'update:modelValue': [value: number | null]
}>()

const periods = ref<any[]>([])
const loading = ref(false)

const selectedPeriod = computed(() =>
    periods.value.find((p: any) => p.id === props.modelValue) ?? null
)

function onChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value
    emit('update:modelValue', val ? Number(val) : null)
}

async function fetchPeriods() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, {
            params: { per_page: 100, order_by: 'id', order_dir: 'desc' },
        })
        periods.value = (data?.items ?? data?.data ?? data ?? []).map((p: any) => ({
            id: p.id,
            name: p.name ?? p.academicPeriod?.name ?? `Periodo #${p.id}`,
            status: p.status,
            statusLabel: p.statusLabel ?? null,
        }))
        maybeAutoSelect()
    } catch {
        periods.value = []
    } finally {
        loading.value = false
    }
}

function maybeAutoSelect() {
    if (props.modelValue != null) return
    if (!props.autoSelectStatus) return
    // Lista ya ordenada por id desc → find() devuelve el más reciente.
    // Fallback a 'active' si no hay del status pedido, así un CAREER_MANAGER
    // que entra fuera de temporada de planeación igual ve datos.
    const pick =
        periods.value.find(p => p.status === props.autoSelectStatus) ??
        (props.autoSelectStatus !== 'active'
            ? periods.value.find(p => p.status === 'active')
            : null)
    if (pick) emit('update:modelValue', pick.id)
}

defineExpose({ selectedPeriod, periods })

onMounted(fetchPeriods)
</script>
