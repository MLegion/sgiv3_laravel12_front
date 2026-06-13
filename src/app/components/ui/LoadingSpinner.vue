<template>
    <svg
        class="animate-spin"
        :class="[sizeClass, colorClass]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        :aria-label="label"
    >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Spinner accesible reutilizable. Resuelve S6 (spinner DIY repetido).
 */

type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
    size?: Size
    /** Clase de color Tailwind (text-*). Default hereda al primario. */
    color?: string
    label?: string
}>(), {
    size: 'md',
    color: 'text-blue-600',
    label: 'Cargando',
})

const sizeClass = computed(() => {
    switch (props.size) {
        case 'sm': return 'h-4 w-4'
        case 'lg': return 'h-8 w-8'
        default:   return 'h-6 w-6'
    }
})

const colorClass = computed(() => props.color)
</script>
