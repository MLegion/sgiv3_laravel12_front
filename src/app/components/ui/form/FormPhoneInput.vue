<template>
    <FormInput
        v-bind="$props"
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
