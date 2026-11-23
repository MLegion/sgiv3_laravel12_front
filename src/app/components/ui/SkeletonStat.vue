<template>
    <div role="status" class="rounded-xl border border-slate-200 bg-white p-4">
        <span class="sr-only">Cargando…</span>
        <div aria-hidden="true" class="space-y-3">
            <!-- etiqueta -->
            <div class="h-3 w-1/2 animate-pulse motion-reduce:animate-none rounded bg-slate-200"></div>
            <!-- número grande -->
            <div class="h-8 w-3/5 animate-pulse motion-reduce:animate-none rounded bg-slate-200"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Skeleton de tarjeta de métrica (etiqueta corta + número grande), para los
 * dashboards y tabs de estadísticas. Mantiene las dimensiones de la tarjeta
 * final para evitar salto de layout al cargar los indicadores.
 */
</script>
