<template>
    <div
        v-if="show"
        class="flex items-center justify-center gap-3"
        :class="absolute ? 'absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px]' : 'py-10'"
        role="status"
        aria-live="polite"
    >
        <LoadingSpinner :size="size" />
        <span v-if="text" class="text-sm text-slate-500">{{ text }}</span>
    </div>
</template>

<script setup lang="ts">
import LoadingSpinner from '@/app/components/ui/LoadingSpinner.vue'

/**
 * Overlay/bloque de carga reutilizable. Resuelve S6.
 *
 * - `absolute` (default true): se superpone al contenedor relativo padre.
 *   Para un bloque inline en flujo normal, pasar :absolute="false".
 *
 * Uso (sección con carga):
 *   <div class="relative">
 *     <LoadingOverlay :show="loading" text="Cargando…" />
 *     ...contenido...
 *   </div>
 */

withDefaults(defineProps<{
    show?: boolean
    text?: string
    absolute?: boolean
    size?: 'sm' | 'md' | 'lg'
}>(), {
    show: true,
    absolute: true,
    size: 'md',
})
</script>
