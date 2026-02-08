<template>
    <tr>
        <td
            v-for="n in columns"
            :key="n"
            class="px-4 py-3"
        >
            <div
                class="h-4 w-full rounded-full bg-slate-200 animate-pulse"
            />
        </td>
    </tr>
</template>

<script setup lang="ts">
defineProps<{
    columns: number
}>()
</script>
