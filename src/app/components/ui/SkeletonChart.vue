<template>
    <div role="status" class="rounded-xl border border-slate-200 bg-white p-4">
        <span class="sr-only">Cargando gráfico…</span>
        <div aria-hidden="true">
            <!-- título del gráfico -->
            <div class="mb-3 h-3 w-40 animate-pulse motion-reduce:animate-none rounded bg-slate-200"></div>
            <!-- área del gráfico: altura FIJA en px (determinada) → las barras en %
                 se resuelven contra ella, sin depender del flex ni estirarse. -->
            <div class="flex items-end gap-2" :style="{ height: `${height}px` }">
                <div
                    v-for="(h, i) in bars"
                    :key="i"
                    class="flex-1 animate-pulse motion-reduce:animate-none rounded-t bg-slate-200"
                    :style="{ height: h }"
                ></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Skeleton de gráfico: reserva una altura FIJA (prop `height` en px, default 256)
 * y sugiere la silueta con barras de alturas variadas. La altura es determinada
 * (estilo inline), así el skeleton nunca se estira para llenar su contenedor ni
 * provoca salto de layout al montar Chart.js.
 */
withDefaults(defineProps<{
    /** Altura del área del gráfico en píxeles. */
    height?: number
}>(), {
    height: 256,
})

// Alturas (en % del área ya fija) desiguales para evocar un gráfico.
const bars = ['38%', '60%', '48%', '78%', '32%', '70%', '44%', '58%']
</script>
