<template>
    <div class="flex items-center justify-between gap-3">
        <!-- Label -->
        <label
            v-if="label"
            class="text-sm font-medium text-slate-700"
        >
            {{ label }}
        </label>

        <!-- Switch -->
        <button
            type="button"
            role="switch"
            :aria-checked="modelValue"
            class="relative inline-flex h-6 w-11 items-center
                   rounded-full transition-colors
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="modelValue
                ? 'bg-blue-600'
                : 'bg-slate-300'"
            @click="toggle"
        >
            <span
                class="inline-block h-5 w-5 transform rounded-full
                       bg-white transition-transform"
                :class="modelValue
                    ? 'translate-x-5'
                    : 'translate-x-1'"
            />
        </button>
    </div>
</template>

<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/* PROPS */
/* -------------------------------------------------------------------------- */
const props = defineProps<{
    modelValue: boolean
    label?: string
}>()

/* -------------------------------------------------------------------------- */
/* EMITS */
/* -------------------------------------------------------------------------- */
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

/* -------------------------------------------------------------------------- */
/* METHODS */
/* -------------------------------------------------------------------------- */
function toggle() {
    emit('update:modelValue', !props.modelValue)
}
</script>
