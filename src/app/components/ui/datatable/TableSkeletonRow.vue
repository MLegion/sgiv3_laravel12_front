<template>
    <tr aria-hidden="true">
        <td
            v-for="n in columns"
            :key="n"
            class="px-4 py-3"
        >
            <div
                class="h-4 rounded bg-slate-200 animate-pulse motion-reduce:animate-none"
                :class="widthFor(n)"
            />
        </td>
    </tr>
</template>

<script setup lang="ts">
defineProps<{
    columns: number
}>()

// Anchos desiguales por columna para imitar la silueta de una tabla real
// (en vez de píldoras uniformes de ancho completo).
const cycle = ['w-16', 'w-3/4', 'w-1/2', 'w-2/3', 'w-20', 'w-5/6']
function widthFor(n: number): string {
    return cycle[(n - 1) % cycle.length]
}
</script>
