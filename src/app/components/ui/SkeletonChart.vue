<template>
    <div role="status" class="rounded-xl border border-slate-200 bg-white p-4">
        <span class="sr-only">Cargando gráfico…</span>
        <div aria-hidden="true" class="space-y-3">
            <!-- título del gráfico -->
            <div class="h-3 w-40 animate-pulse motion-reduce:animate-none rounded bg-slate-200"></div>
            <!-- área del gráfico: barras de alturas variadas, a la altura final -->
            <div class="flex items-end gap-2" :class="height">
                <div
                    v-for="(h, i) in bars"
                    :key="i"
                    class="flex-1 animate-pulse motion-reduce:animate-none rounded-t bg-slate-200"
                    :class="h"
                ></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Skeleton de gráfico: reserva la altura final del chart y sugiere su silueta
 * con barras de alturas variadas, para que al montar Chart.js no haya un salto
 * brusco de layout. `height` controla el alto del área (default h-64).
 */
withDefaults(defineProps<{
    height?: string
}>(), {
    height: 'h-64',
})

// Alturas desiguales para evocar un gráfico sin parecer una rejilla.
const bars = ['h-2/5', 'h-3/5', 'h-1/2', 'h-4/5', 'h-1/3', 'h-3/4', 'h-2/5', 'h-3/5']
</script>
