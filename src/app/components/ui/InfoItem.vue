<template>
    <div class="space-y-1">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {{ label }}
        </p>

        <div class="text-sm text-slate-700 font-medium min-h-[20px] flex items-center">
            <!-- Usando el componente base cuando está cargando -->
            <template v-if="loading">
                <Skeleton width="w-24" height="h-3" />
            </template>

            <!-- Estado con Contenido Real -->
            <template v-else>
                <template v-if="hasSlotContent">
                    <slot />
                </template>

                <template v-else-if="hasValue">
                    {{ value }}
                </template>

                <template v-else>
                    <span class="text-slate-300">—</span>
                </template>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import Skeleton from '@/app/components/ui/Skeleton.vue'

const props = defineProps<{
    label: string
    value?: string | number | null
    loading?: boolean // Nueva prop para controlar el estado
}>()

const slots = useSlots()

const hasSlotContent = computed(() => !!slots.default)

const hasValue = computed(() => {
    return props.value !== undefined && props.value !== null && props.value !== ''
})
</script>
