<template>
    <FormInput
        v-bind="$props"
        type="email"
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
