<template>
    <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold text-slate-800">{{ title }}</h1>
        <div class="flex items-center gap-2">
            <span v-if="hasDraft && !editing" class="text-xs text-amber-600 font-medium">
                Cambios sin guardar
            </span>
            <button
                v-if="!editing"
                class="px-4 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-100 font-medium"
                @click="$emit('edit')"
            >
                EDITAR
            </button>
            <template v-if="editing">
                <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50" @click="$emit('cancel')">
                    CANCELAR
                </button>
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="submitting"
                    @click="$emit('save')"
                >
                    {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                </button>
            </template>
        </div>
    </div>
    <p v-if="saveError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
        {{ saveError }}
    </p>
</template>

<script setup lang="ts">
defineProps<{
    title: string
    editing: boolean
    submitting: boolean
    hasDraft?: boolean
    saveError?: string | null
}>()
defineEmits<{
    (e: 'edit'): void
    (e: 'cancel'): void
    (e: 'save'): void
}>()
</script>
