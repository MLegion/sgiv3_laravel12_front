<template>
    <div class="space-y-1">
        <label v-if="label" :for="fieldId" class="text-xs font-medium text-slate-600">
            {{ label }}
        </label>

        <textarea
            :id="fieldId"
            :value="modelValue ?? ''"
            :placeholder="placeholder"
            :required="required"
            :disabled="disabled"
            :rows="rows ?? 3"
            class="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 disabled:bg-slate-100"
            :class="computedError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'"
            @input="onInput"
        />

        <p v-if="computedError" class="text-xs text-red-600">
            {{ computedError }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const fieldId = `fld-${Math.random().toString(36).slice(2, 9)}`

const props = defineProps<{
    modelValue: string | null | undefined
    label?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    rows?: number
    error?: string | null
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const computedError = computed(() => props.error || null)

function onInput(e: Event) {
    emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>
