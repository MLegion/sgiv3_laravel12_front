<template>
    <FormInput
        :model-value="props.modelValue"
        :label="props.label"
        :placeholder="props.placeholder"
        :required="props.required"
        :disabled="props.disabled"
        type="email"
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (value && !emailRegex.test(value)) {
        internalError.value = 'Correo inválido'
        emit('validation-error', internalError.value)
    } else {
        internalError.value = null
        emit('validation-error', null)
    }

    emit('update:modelValue', value)
}
</script>
