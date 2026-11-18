<template>
    <BaseModal
        :model-value="state.open"
        :title="state.title"
        size="md"
        hide-close
        @update:model-value="(v: boolean) => { if (!v) cancel() }"
    >
        <div class="space-y-2">
            <p v-if="state.message" class="text-sm text-slate-600">{{ state.message }}</p>
            <label class="block">
                <span v-if="state.label" class="block text-xs font-semibold text-slate-500 mb-1">{{ state.label }}</span>
                <textarea
                    v-if="state.inputType === 'textarea'"
                    v-model="state.value"
                    rows="3"
                    :placeholder="state.placeholder"
                    class="w-full rounded-lg border-slate-300 text-sm"
                    @keydown.ctrl.enter.prevent="accept"
                ></textarea>
                <input
                    v-else
                    v-model="state.value"
                    :type="state.inputType"
                    :placeholder="state.placeholder"
                    class="w-full rounded-lg border-slate-300 text-sm"
                    @keydown.enter.prevent="accept"
                />
            </label>
            <p v-if="state.error" class="text-sm text-red-600">{{ state.error }}</p>
        </div>
        <template #footer>
            <button type="button" class="px-4 py-2 rounded-lg border text-sm" @click="cancel">{{ state.cancelText }}</button>
            <button type="button" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold" @click="accept">{{ state.confirmText }}</button>
        </template>
    </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import { _promptHost } from '@/app/composables/usePrompt'

/**
 * Host único para usePrompt(). Se monta una sola vez en AppLayout.
 * Renderiza un BaseModal con un solo campo, dirigido por el estado del
 * composable. Se usa `hide-close` para que BaseModal enfoque el campo al abrir
 * (el primer foco cae en el input en vez del botón ✕); se cancela con Escape,
 * el botón Cancelar o click fuera.
 */
const { state, accept, cancel } = _promptHost()
</script>
