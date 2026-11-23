<template>
    <div role="status" class="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
        <span class="sr-only">Cargando…</span>
        <div aria-hidden="true">
            <!-- Encabezado tenue -->
            <div class="flex gap-4 border-b border-slate-200 bg-slate-50/60 px-4 py-3">
                <div
                    v-for="c in cols"
                    :key="`h-${c}`"
                    class="h-3 animate-pulse motion-reduce:animate-none rounded bg-slate-200"
                    :class="colWidth(c)"
                ></div>
            </div>
            <!-- Filas -->
            <div
                v-for="r in rows"
                :key="`r-${r}`"
                class="flex gap-4 border-b border-slate-100 px-4 py-3 last:border-0"
            >
                <div
                    v-for="c in cols"
                    :key="`${r}-${c}`"
                    class="h-4 animate-pulse motion-reduce:animate-none rounded bg-slate-200"
                    :class="colWidth(c)"
                ></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Skeleton de tabla standalone para listas escritas a mano (no DataTable).
 * Imita la silueta de una tabla real: encabezado tenue + filas con columnas de
 * anchos VARIADOS (no píldoras uniformes), para que la llegada de datos no
 * produzca salto de layout. Reemplaza los "Cargando…" de texto plano.
 */
withDefaults(defineProps<{
    rows?: number
    cols?: number
}>(), {
    rows: 5,
    cols: 4,
})

// Ciclo de anchos desiguales por columna (la 1ª angosta tipo "id/estado").
const widths = ['w-16', 'flex-1', 'w-28', 'flex-1', 'w-20', 'w-24']
function colWidth(c: number): string {
    return widths[(c - 1) % widths.length]
}
</script>
