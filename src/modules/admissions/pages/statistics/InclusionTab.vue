<template>
    <div class="space-y-6">
        <div v-if="loading" class="py-12 text-center text-slate-400 text-sm">Cargando...</div>

        <template v-else-if="data">
            <p class="text-sm text-slate-500">
                Métricas de inclusión sobre <strong>{{ data.total }}</strong> aspirantes.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InclusionCategory label="Discapacidad"            :data="data.disability" />
                <InclusionCategory label="Grupo indígena"          :data="data.indigenousGroup" />
                <InclusionCategory label="Lengua indígena"         :data="data.indigenousLanguage" />
                <InclusionCategory label="Beca"                    :data="data.scholarship" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import InclusionCategory from './InclusionCategory.vue'

interface BreakdownItem { id: number; name: string; count: number }
interface CategoryStats { withCount: number; withoutCount: number; percentage: number; breakdown: BreakdownItem[] }
interface InclusionResponse {
    total: number
    disability: CategoryStats
    indigenousGroup: CategoryStats
    indigenousLanguage: CategoryStats
    scholarship: CategoryStats
}

const props = defineProps<{ periodId: number | null }>()

const loading = ref(false)
const data    = ref<InclusionResponse | null>(null)

async function load() {
    loading.value = true
    try {
        const params = new URLSearchParams()
        if (props.periodId) params.set('academic_period_id', String(props.periodId))
        const { data: res } = await api.get<InclusionResponse>(API.ADMISSIONS_API.statistics.inclusion(params.toString()))
        data.value = res
    } finally {
        loading.value = false
    }
}

watch(() => props.periodId, load, { immediate: true })
</script>
