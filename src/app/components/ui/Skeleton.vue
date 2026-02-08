<template>
    <div
        :class="[
            'animate-pulse bg-slate-200 rounded',
            widthClass,
            heightClass
        ]"
    ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
    width?: string
    height?: string
}>(), {
    width: 'w-full',
    height: 'h-4'
})

const widthClass = computed(() => props.width)
const heightClass = computed(() => props.height)
</script>
