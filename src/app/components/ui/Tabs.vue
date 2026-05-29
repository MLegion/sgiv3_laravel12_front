<template>
    <div>
        <!-- Barra de pestañas (scroll horizontal si son muchas) -->
        <div class="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 rounded-t-lg px-1">
            <button
                v-for="tab in tabs"
                :key="tab.key"
                type="button"
                class="whitespace-nowrap px-3 py-2 text-xs font-medium border-b-2 -mb-px transition"
                :class="tab.key === modelValue
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'"
                @click="$emit('update:modelValue', tab.key)"
            >
                {{ tab.label }}
            </button>
        </div>
        <div class="bg-white border border-t-0 border-slate-200 rounded-b-lg p-4">
            <slot :active="modelValue" />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string
    tabs: { key: string; label: string }[]
}>()
defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>
