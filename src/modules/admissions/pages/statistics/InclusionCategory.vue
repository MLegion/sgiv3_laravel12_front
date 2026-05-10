<template>
    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div class="flex items-baseline justify-between">
            <h3 class="text-sm font-semibold text-slate-800 uppercase">{{ label }}</h3>
            <span class="text-xs text-slate-500">{{ data.percentage.toFixed(2) }}% del total</span>
        </div>

        <div class="flex items-baseline gap-3">
            <p class="text-2xl font-bold text-emerald-700 tabular-nums">{{ data.withCount }}</p>
            <p class="text-xs text-slate-500">con dato &middot; {{ data.withoutCount }} sin dato</p>
        </div>

        <div v-if="data.breakdown.length > 0" class="space-y-1">
            <div
                v-for="item in data.breakdown"
                :key="item.id"
                class="flex items-center gap-2"
            >
                <span class="text-xs text-slate-600 truncate flex-1" :title="item.name">{{ item.name }}</span>
                <div class="flex-1 h-2 bg-slate-100 rounded overflow-hidden">
                    <div
                        class="h-full bg-emerald-500"
                        :style="{ width: barWidth(item.count) + '%' }"
                    />
                </div>
                <span class="text-xs tabular-nums text-slate-700 w-8 text-right">{{ item.count }}</span>
            </div>
        </div>
        <p v-else class="text-xs text-slate-400 italic">Sin desglose.</p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface BreakdownItem { id: number; name: string; count: number }
interface CategoryStats { withCount: number; withoutCount: number; percentage: number; breakdown: BreakdownItem[] }

const props = defineProps<{
    label: string
    data: CategoryStats
}>()

const maxCount = computed(() =>
    Math.max(1, ...props.data.breakdown.map(b => b.count))
)

function barWidth(count: number): number {
    return Math.round((count / maxCount.value) * 100)
}
</script>
