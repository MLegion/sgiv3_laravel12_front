<template>
    <div>
        <!-- Botón de ayuda -->
        <div class="flex justify-end">
            <button type="button"
                class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                @click="open = true">
                <QuestionMarkCircleIcon class="w-4 h-4" /> ¿Cómo lleno esta sección?
            </button>
        </div>

        <!-- Drawer -->
        <Teleport to="body">
            <div v-if="open" class="fixed inset-0 z-50 flex justify-end">
                <div class="absolute inset-0 bg-black/40" @click="open = false" />
                <aside
                    ref="panelRef"
                    role="dialog"
                    aria-modal="true"
                    :aria-label="title"
                    tabindex="-1"
                    class="relative w-full max-w-md bg-white h-full shadow-xl overflow-y-auto focus:outline-none"
                >
                    <div class="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
                        <h3 class="text-sm font-bold text-slate-800 uppercase">{{ title }}</h3>
                        <button type="button" class="text-slate-400 hover:text-slate-700 text-xl leading-none" @click="open = false">&times;</button>
                    </div>
                    <div class="p-5 space-y-6 text-sm text-slate-700">
                        <slot />
                    </div>
                </aside>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import { useFocusTrap } from '@/app/composables/useFocusTrap'

defineProps<{ title: string }>()

const open = ref(false)
const panelRef = ref<HTMLElement | null>(null)
useFocusTrap(panelRef, () => open.value, () => { open.value = false })
</script>
