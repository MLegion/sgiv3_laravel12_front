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
            <option v-for="p in visiblePeriods" :key="p.id" :value="p.id">
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
     * cuyo status coincida.
     *
     * Acepta string (un solo status) o string[] (lista de prioridad).
     * Recorre la lista en orden y toma el PRIMER status que tenga match
     * en algún periodo. Ej. `['planned', 'draft', 'active']` busca primero
     * un periodo planeado; si no hay, uno en draft; en último caso uno
     * activo.
     *
     * Pensado para CAREER_MANAGER y similares: entrar a la página ya con
     * un periodo razonable seleccionado.
     */
    autoSelectStatus?: string | string[] | null
    /**
     * Statuses a ocultar del dropdown. La auto-selección también los ignora.
     * Útil p.ej. para esconder `['archived']` por default y dejar que la
     * página padre los muestre vía checkbox cuando el user lo pida.
     */
    excludeStatuses?: string[]
}>(), {
    label: 'PERIODO ACADÉMICO',
    placeholder: '-- SELECCIONAR PERIODO --',
    disabled: false,
    autoSelectStatus: null,
    excludeStatuses: () => [],
})

const emit = defineEmits<{
    'update:modelValue': [value: number | null]
    /**
     * Se emite SOLO cuando el componente eligió el periodo por sí mismo
     * (auto-selección al cargar). NO se emite en cambios manuales del
     * usuario. Útil para que la página padre active automáticamente el
     * modo "locked" sin esperar click manual en el candado.
     */
    'auto-selected':     [period: { id: number; name: string; status: string | null; statusLabel: string | null }]
}>()

const periods = ref<any[]>([])
const loading = ref(false)

const visiblePeriods = computed(() =>
    props.excludeStatuses.length === 0
        ? periods.value
        : periods.value.filter(p => !props.excludeStatuses.includes(p.status))
)

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

    // Normalizamos a array de prioridad. Lista ya ordenada por id desc →
    // find() devuelve el más reciente para cada status candidato.
    const wanted = Array.isArray(props.autoSelectStatus)
        ? props.autoSelectStatus
        : [props.autoSelectStatus]

    for (const status of wanted) {
        // No auto-seleccionar un periodo que está oculto por excludeStatuses.
        if (props.excludeStatuses.includes(status)) continue
        const pick = periods.value.find(p => p.status === status)
        if (pick) {
            emit('update:modelValue', pick.id)
            emit('auto-selected', {
                id:          pick.id,
                name:        pick.name,
                status:      pick.status ?? null,
                statusLabel: pick.statusLabel ?? null,
            })
            return
        }
    }
}

defineExpose({ selectedPeriod, periods, visiblePeriods })

onMounted(fetchPeriods)
</script>
