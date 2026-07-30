<template>
    <div>
        <!-- Barra de pestañas (scroll horizontal si son muchas) -->
        <div
            role="tablist"
            :aria-label="ariaLabel"
            class="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 rounded-t-lg px-1"
        >
            <button
                v-for="(tab, i) in tabs"
                :key="tab.key"
                :ref="el => setTabRef(el, i)"
                type="button"
                role="tab"
                :id="tabId(tab.key)"
                :aria-selected="tab.key === modelValue"
                :aria-controls="panelId"
                :tabindex="tab.key === modelValue ? 0 : -1"
                class="whitespace-nowrap px-3 py-2 text-xs font-medium border-b-2 -mb-px transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded-t"
                :class="tab.key === modelValue
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'"
                @click="$emit('update:modelValue', tab.key)"
                @keydown="onKeydown($event, i)"
            >
                {{ tab.label }}
            </button>
        </div>
        <div
            role="tabpanel"
            :id="panelId"
            :aria-labelledby="tabId(modelValue)"
            tabindex="0"
            class="bg-white border border-t-0 border-slate-200 rounded-b-lg p-4 focus:outline-none"
        >
            <slot :active="modelValue" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'

const props = defineProps<{
    modelValue: string
    tabs: { key: string; label: string }[]
    ariaLabel?: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const uid = Math.random().toString(36).slice(2, 8)
const panelId = `tabpanel-${uid}`
const tabId = (key: string) => `tab-${uid}-${key}`

const tabEls: (HTMLElement | null)[] = []
function setTabRef(el: any, i: number): void {
    tabEls[i] = (el as HTMLElement | null)
}

/**
 * Navegación por teclado del patrón ARIA Tabs (activación automática): las
 * flechas mueven el foco y seleccionan la pestaña; Home/End van a los extremos.
 */
function onKeydown(e: KeyboardEvent, index: number): void {
    const last = props.tabs.length - 1
    let next = index

    switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown': next = index >= last ? 0 : index + 1; break
        case 'ArrowLeft':
        case 'ArrowUp':   next = index <= 0 ? last : index - 1; break
        case 'Home':      next = 0; break
        case 'End':       next = last; break
        default: return
    }

    e.preventDefault()
    const target = props.tabs[next]
    if (!target) return
    emit('update:modelValue', target.key)
    nextTick(() => tabEls[next]?.focus())
}
</script>
