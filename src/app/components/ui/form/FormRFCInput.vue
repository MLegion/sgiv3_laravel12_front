<template>
    <FormInput
        v-bind="$props"
        uppercase
        :error="error || internalError"
        @update:modelValue="onUpdate"
        @validation-error="emit('validation-error', $event)"
    />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FormInput from './FormInput.vue'

const props = defineProps({
    modelValue: String,
    label: String,
    placeholder: String,
    required: Boolean,
    disabled: Boolean,
    error: String,
})

const emit = defineEmits(['update:modelValue', 'validation-error'])

const internalError = ref<string | null>(null)

function onUpdate(value: string) {
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/

    if (value && !rfcRegex.test(value)) {
        internalError.value = 'RFC inválido'
        emit('validation-error', internalError.value)
    } else {
        internalError.value = null
        emit('validation-error', null)
    }

    emit('update:modelValue', value)
}
</script>
