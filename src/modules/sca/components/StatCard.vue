<template>
    <div class="bg-white rounded-xl border border-slate-200 p-3">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ label }}</p>
        <p class="text-lg font-bold" :class="colorClass">{{ value }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    label: string
    value: string
    color?: 'slate' | 'red' | 'amber' | 'emerald' | 'indigo'
}>()

const colorClass = computed(() => {
    switch (props.color) {
        case 'red':     return 'text-red-600'
        case 'amber':   return 'text-amber-600'
        case 'emerald': return 'text-emerald-600'
        case 'indigo':  return 'text-indigo-600'
        default:        return 'text-slate-800'
    }
})
</script>
