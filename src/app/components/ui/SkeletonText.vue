<template>
    <div role="status" class="space-y-2">
        <span class="sr-only">Cargando…</span>
        <div
            v-for="n in lines"
            :key="n"
            aria-hidden="true"
            class="animate-pulse motion-reduce:animate-none rounded bg-slate-200"
            :class="[lineHeight, widthFor(n)]"
        ></div>
    </div>
</template>

<script setup lang="ts">
/**
 * Skeleton de texto: N líneas de anchos variados (la última más corta), para
 * imitar la silueta de un párrafo o de los valores de campos mientras cargan.
 * Pulso calmo, respeta prefers-reduced-motion y anuncia "Cargando" a lectores
 * de pantalla (role=status + texto oculto); las barras son decorativas.
 */
const props = withDefaults(defineProps<{
    lines?: number
    lineHeight?: string
}>(), {
    lines: 3,
    lineHeight: 'h-4',
})

// Anchos que decrecen/varían para que no parezca una rejilla uniforme.
const cycle = ['w-full', 'w-11/12', 'w-5/6']
function widthFor(n: number): string {
    if (props.lines > 1 && n === props.lines) return 'w-2/5' // última línea corta
    return cycle[(n - 1) % cycle.length]
}
</script>
