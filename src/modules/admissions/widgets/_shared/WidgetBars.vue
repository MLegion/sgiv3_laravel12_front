<template>
    <!-- Columnas verticales con eje Y y cantidad dentro de la barra -->
    <div v-if="vertical" class="flex items-start gap-1">
        <!-- Eje Y (cantidad) -->
        <div class="flex flex-col justify-between items-end text-[9px] text-slate-400 pr-1 shrink-0 tabular-nums" :style="{ height: PLOT_H + 'px' }">
            <span>{{ maxVal }}</span>
            <span>{{ Math.round(maxVal / 2) }}</span>
            <span>0</span>
        </div>
        <!-- Columnas -->
        <div class="flex-1 flex items-start gap-1.5 border-l border-slate-200 pl-1">
            <div v-for="(it, i) in items" :key="it.key ?? i" class="flex-1 flex flex-col items-center min-w-0">
                <div class="w-full flex items-end border-b border-slate-200" :style="{ height: PLOT_H + 'px' }">
                    <div
                        class="w-full rounded-t transition-all duration-500 flex justify-center items-start"
                        :class="it.color ?? paletteColor(i)"
                        :style="{ height: colHeight(it.count) }"
                    >
                        <span v-if="it.count > 0" class="text-[9px] font-bold text-white leading-none pt-0.5">{{ it.count }}</span>
                    </div>
                </div>
                <span class="mt-1 text-[9px] text-slate-500 text-center leading-tight w-full truncate" :title="it.label">
                    {{ it.label }}
                </span>
                <span v-if="it.sub" class="text-[9px] text-slate-400">{{ it.sub }}</span>
            </div>
        </div>
    </div>

    <!-- Barras horizontales (default) -->
    <div v-else class="flex flex-col gap-1.5">
        <div v-for="(it, i) in items" :key="it.key ?? i">
            <div class="flex items-center justify-between text-[11px] mb-0.5 gap-2">
                <span class="font-medium text-slate-600 truncate" :title="it.label">{{ it.label }}</span>
                <span class="tabular-nums text-slate-500 shrink-0">
                    {{ it.count }}<span v-if="it.sub" class="text-slate-400"> · {{ it.sub }}</span>
                </span>
            </div>
            <div class="h-2.5 bg-slate-100 rounded">
                <div
                    class="h-2.5 rounded transition-all duration-500"
                    :class="it.color ?? paletteColor(i)"
                    :style="{ width: barWidth(it.count) }"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Item { key?: string | number; label: string; count: number; sub?: string; color?: string }
const props = defineProps<{ items: Item[]; max?: number; vertical?: boolean }>()

const PALETTE = [
    'bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-amber-500',
    'bg-emerald-500', 'bg-teal-500', 'bg-rose-500', 'bg-cyan-500',
]
function paletteColor(i: number): string { return PALETTE[i % PALETTE.length] }

const maxVal = computed(() => props.max ?? Math.max(1, ...props.items.map(i => i.count)))
function barWidth(c: number): string {
    return c <= 0 ? '0%' : Math.max(3, Math.round((c / maxVal.value) * 100)) + '%'
}

// Modo vertical: alto del área de graficado y alto de cada columna (mínimo para que
// quepa el número dentro de la barra).
const PLOT_H = 130
function colHeight(c: number): string {
    return c <= 0 ? '0%' : Math.max(14, Math.round((c / maxVal.value) * 100)) + '%'
}
</script>
