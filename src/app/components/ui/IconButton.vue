<template>
    <button
        :type="type"
        :disabled="disabled"
        :aria-label="label"
        :title="label"
        class="inline-flex items-center justify-center rounded-lg transition-colors
               focus:outline-none focus:ring-2 focus:ring-offset-1
               disabled:opacity-40 disabled:cursor-not-allowed"
        :class="[sizeClass, toneClass]"
        @click="$emit('click', $event)"
    >
        <slot />
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Botón solo-ícono accesible. Resuelve el problema sistémico S3: botones de
 * acción (Ver/Editar/Eliminar) sin nombre accesible para lectores de pantalla.
 *
 * `label` es OBLIGATORIO y se usa como aria-label y title. El ícono va en el slot.
 *
 * Uso:
 *   <IconButton label="Editar aspirante" tone="primary" @click="edit(row)">
 *     <svg ...heroicon... />
 *   </IconButton>
 */

type Tone = 'neutral' | 'primary' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
    /** Nombre accesible de la acción (obligatorio). */
    label: string
    tone?: Tone
    size?: Size
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
}>(), {
    tone: 'neutral',
    size: 'md',
    type: 'button',
    disabled: false,
})

defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

const sizeClass = computed(() => {
    switch (props.size) {
        case 'sm': return 'h-8 w-8 [&_svg]:h-4 [&_svg]:w-4'
        case 'lg': return 'h-11 w-11 [&_svg]:h-6 [&_svg]:w-6'
        default:   return 'h-9 w-9 [&_svg]:h-5 [&_svg]:w-5'
    }
})

const toneClass = computed(() => {
    switch (props.tone) {
        case 'primary': return 'text-blue-600 hover:bg-blue-50 focus:ring-blue-400'
        case 'danger':  return 'text-red-600 hover:bg-red-50 focus:ring-red-400'
        case 'success': return 'text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-400'
        default:        return 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:ring-slate-300'
    }
})
</script>
