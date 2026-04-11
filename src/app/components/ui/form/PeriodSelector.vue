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
}>(), {
    label: 'PERIODO ACADÉMICO',
    placeholder: '-- SELECCIONAR PERIODO --',
    disabled: false,
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
    } catch {
        periods.value = []
    } finally {
        loading.value = false
    }
}

defineExpose({ selectedPeriod, periods })

onMounted(fetchPeriods)
</script>
