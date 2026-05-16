<template>
    <ConfirmModal
        :model-value="modelValue"
        title="Formato no disponible"
        :message="messageText"
        confirm-text="ENTENDIDO"
        variant="warning"
        hide-cancel
        @update:model-value="(v) => emit('update:modelValue', v)"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'

const props = withDefaults(defineProps<{
    modelValue: boolean
    code: string
    reason?: 'missing' | 'inactive'
}>(), {
    reason: 'missing',
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const messageText = computed(() => {
    const intro = props.reason === 'inactive'
        ? `El formato \`${props.code}\` existe pero se encuentra inactivo para esta institución.`
        : `Falta el formato \`${props.code}\` para esta institución.`
    return `${intro}\n\nComuníquese con el administrador del sistema para configurarlo.`
})
</script>
