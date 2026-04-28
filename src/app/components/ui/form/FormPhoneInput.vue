<template>
    <FormInput
        :model-value="props.modelValue"
        :label="props.label"
        :placeholder="props.placeholder"
        :required="props.required"
        :disabled="props.disabled"
        :error="props.error || internalError"
        @update:model-value="onUpdate"
        @validation-error="emit('validation-error', $event)"
    />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FormInput from './FormInput.vue'

const props = defineProps<{
    modelValue?: string
    label?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    error?: string | null
}>()

const emit = defineEmits(['update:modelValue', 'validation-error'])
const internalError = ref<string | null>(null)

function onUpdate(value: string) {
    if (value && !/^\d+$/.test(value)) {
        internalError.value = 'Solo se permiten números'
        emit('validation-error', internalError.value)
    } else {
        internalError.value = null
        emit('validation-error', null)
    }

    emit('update:modelValue', value)
}
</script>
