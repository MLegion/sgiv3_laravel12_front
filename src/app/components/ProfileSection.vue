<template>
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div class="flex items-center justify-between gap-2">
            <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest">{{ title }}</h2>
            <slot name="actions" />
        </div>
        <slot />
    </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
