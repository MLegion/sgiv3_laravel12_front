<template>
    <div>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {{ label }}
        </p>

        <div class="mt-0.5 text-sm text-slate-700 font-medium">
            <template v-if="hasSlotContent">
                <slot />
            </template>

            <template v-else-if="hasValue">
                {{ value }}
            </template>

            <template v-else>
                <span class="text-slate-300">—</span>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = defineProps<{
    label: string
    value?: string | number | null
}>()

const slots = useSlots()

// Detecta si el slot 'default' tiene elementos asignados
const hasSlotContent = computed(() => !!slots.default)

// Detecta si la prop value tiene un valor válido
const hasValue = computed(() => {
    return props.value !== undefined && props.value !== null && props.value !== ''
})
</script>
