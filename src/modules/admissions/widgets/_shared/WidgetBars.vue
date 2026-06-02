<template>
    <div class="flex flex-col gap-1.5">
        <div v-for="(it, i) in items" :key="it.key ?? i">
            <div class="flex items-center justify-between text-[11px] mb-0.5 gap-2">
                <span class="font-medium text-slate-600 truncate" :title="it.label">{{ it.label }}</span>
                <span class="tabular-nums text-slate-500 shrink-0">
                    {{ it.count }}<span v-if="it.sub" class="text-slate-400"> · {{ it.sub }}</span>
                </span>
            </div>
            <div class="h-2.5 bg-slate-100 rounded">
                <div
                    class="h-2.5 rounded transition-all duration-500"
                    :class="it.color ?? paletteColor(i)"
                    :style="{ width: barWidth(it.count) }"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Item { key?: string | number; label: string; count: number; sub?: string; color?: string }
const props = defineProps<{ items: Item[]; max?: number }>()

const PALETTE = [
    'bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-amber-500',
    'bg-emerald-500', 'bg-teal-500', 'bg-rose-500', 'bg-cyan-500',
]
function paletteColor(i: number): string { return PALETTE[i % PALETTE.length] }

const maxVal = computed(() => props.max ?? Math.max(1, ...props.items.map(i => i.count)))
function barWidth(c: number): string {
    return c <= 0 ? '0%' : Math.max(3, Math.round((c / maxVal.value) * 100)) + '%'
}
</script>
