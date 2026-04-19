<template>
    <div>
        <label class="block text-xs font-semibold text-slate-500 mb-1">{{ label }}</label>
        <input
            v-if="editing"
            :value="modelValue ?? value ?? ''"
            @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            :type="type"
            class="w-full text-sm font-medium text-slate-700 rounded-lg px-3 py-2 min-h-[36px] border border-indigo-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
        <p v-else class="text-sm font-medium text-slate-700 bg-slate-50 rounded-lg px-3 py-2 min-h-[36px]">
            {{ value || '---' }}
        </p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    label: string
    value?: string | null
    modelValue?: string | null
    editing?: boolean
    type?: string
}>()

defineEmits<{
    'update:modelValue': [val: string]
}>()
</script>
