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

const curpRegex =
    /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/

function onUpdate(value: string) {
    if (value && !curpRegex.test(value)) {
        internalError.value = 'CURP inválida'
        emit('validation-error', internalError.value)
    } else {
        internalError.value = null
        emit('validation-error', null)
    }
    emit('update:modelValue', value)
}
</script>
