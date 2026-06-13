<template>
    <ConfirmModal
        :model-value="state.open"
        :title="state.title"
        :message="state.message"
        :confirm-text="state.confirmText"
        :cancel-text="state.cancelText"
        :variant="state.variant"
        @confirm="accept"
        @update:model-value="(v: boolean) => { if (!v) reject() }"
    />
</template>

<script setup lang="ts">
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'
import { _confirmHost } from '@/app/composables/useConfirm'

/**
 * Host único para useConfirm(). Se monta una sola vez en AppLayout.
 * Renderiza el ConfirmModal global dirigido por el estado del composable.
 */
const { state, accept, reject } = _confirmHost()
</script>
