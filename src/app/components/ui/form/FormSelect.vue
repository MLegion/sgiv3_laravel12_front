<template>
    <div class="space-y-1">
        <label v-if="label" class="text-xs font-medium text-slate-600">
            {{ label }}
        </label>

        <select
            :value="modelValue"
            :disabled="disabled"
            class="w-full px-3 py-2 text-sm rounded-lg border
                   focus:outline-none focus:ring-2
                   disabled:bg-slate-100"
            :class="inputClass"
            @change="onChange"
        >
            <option value="">Seleccionar</option>
            <option
                v-for="opt in options"
                :key="opt.value"
                :value="opt.value"
            >
                {{ opt.label }}
            </option>
        </select>

        <p v-if="computedError" class="text-xs text-red-600">
            {{ computedError }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
    modelValue: any
    label?: string
    options: { label: string; value: any }[]
    required?: boolean
    disabled?: boolean
    error?: string | null
}>()

const emit = defineEmits(['update:modelValue', 'validation-error'])
const internalError = ref<string | null>(null)

watch(() => props.modelValue, validate, { immediate: true })

function onChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value
    emit('update:modelValue', value || null)
    validate()
}

function validate() {
    if (props.required && !props.modelValue) {
        internalError.value = 'Campo requerido'
    } else {
        internalError.value = null
    }
    emit('validation-error', internalError.value)
}

const computedError = computed(() => props.error || internalError.value)
const inputClass = computed(() =>
    computedError.value
        ? 'border-red-500 focus:ring-red-500'
        : 'border-slate-300 focus:ring-blue-500'
)
</script>
