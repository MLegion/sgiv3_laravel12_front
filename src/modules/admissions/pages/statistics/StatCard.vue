<template>
    <div class="rounded-lg border p-3 text-center" :class="bgClasses">
        <p class="text-2xl font-bold tabular-nums" :class="textClasses">{{ display }}</p>
        <p class="text-[11px] uppercase mt-0.5" :class="labelClasses">{{ label }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    label: string
    value: number | null
    color: 'slate' | 'red' | 'green' | 'blue' | 'purple'
}>()

const display = computed(() =>
    props.value === null || props.value === undefined ? '—' : props.value
)

const bgClasses = computed(() => ({
    slate:  'border-slate-200 bg-slate-50',
    red:    'border-red-200 bg-red-50',
    green:  'border-green-200 bg-green-50',
    blue:   'border-blue-200 bg-blue-50',
    purple: 'border-purple-200 bg-purple-50',
}[props.color]))

const textClasses = computed(() => ({
    slate:  'text-slate-800',
    red:    'text-red-700',
    green:  'text-green-700',
    blue:   'text-blue-700',
    purple: 'text-purple-700',
}[props.color]))

const labelClasses = computed(() => ({
    slate:  'text-slate-500',
    red:    'text-red-500',
    green:  'text-green-600',
    blue:   'text-blue-600',
    purple: 'text-purple-600',
}[props.color]))
</script>
