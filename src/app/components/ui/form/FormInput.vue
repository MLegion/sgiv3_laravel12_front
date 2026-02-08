<template>
    <div class="space-y-1">
        <label v-if="label" class="text-xs font-medium text-slate-600">
            {{ label }}
        </label>

        <input
            :type="type"
            :value="localValue"
            :placeholder="placeholder"
            :required="required"
            :disabled="disabled"
            class="w-full px-3 py-2 text-sm rounded-lg border
                   focus:outline-none focus:ring-2
                   disabled:bg-slate-100"
            :class="inputClass"
            @input="onInput"
            @blur="validate"
        />

        <p v-if="computedError" class="text-xs text-red-600">
            {{ computedError }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
    modelValue: string | number | null
    label?: string
    type?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    uppercase?: boolean
    error?: string | null
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'validation-error', value: string | null): void
}>()

const localValue = ref(props.modelValue ?? '')
const internalError = ref<string | null>(null)

watch(() => props.modelValue, v => {
    localValue.value = v ?? ''
})

const computedError = computed(() => props.error || internalError.value)

function onInput(e: Event) {
    let value = (e.target as HTMLInputElement).value
    if (props.uppercase) value = value.toUpperCase()

    localValue.value = value
    emit('update:modelValue', value)
    validate()
}

function validate() {
    if (props.required && !localValue.value) {
        internalError.value = 'Campo requerido'
    } else {
        internalError.value = null
    }
    emit('validation-error', internalError.value)
}

const inputClass = computed(() =>
    computedError.value
        ? 'border-red-500 focus:ring-red-500'
        : 'border-slate-300 focus:ring-blue-500'
)
</script>
