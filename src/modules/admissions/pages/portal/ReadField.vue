<template>
    <div class="min-w-0 rounded-lg px-2 py-1" :class="highlight ? 'bg-yellow-50 ring-1 ring-yellow-300' : ''">
        <p class="text-xs text-slate-400 leading-4">{{ label }}</p>
        <p class="font-medium text-slate-700 leading-5 min-h-[1.25rem] break-words">
            {{ (value !== null && value !== undefined && value !== '') ? value : '—' }}
        </p>
    </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value?: string | number | null; highlight?: boolean }>()
</script>
