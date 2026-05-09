<template>
    <div class="relative" ref="rootRef">
        <input
            ref="inputRef"
            :value="modelValue"
            type="text"
            class="w-full border rounded-md px-2 py-1.5 pr-24 text-sm"
            :placeholder="placeholder || 'Asunto del mensaje...'"
            @input="onInput"
            @select="updateCaret"
            @keyup="updateCaret"
            @click="updateCaret"
        />
        <button
            v-if="variables && Object.keys(variables).length > 0"
            type="button"
            class="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold tracking-wide text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50"
            @click.stop="open = !open"
        >+ variable</button>

        <div
            v-if="open"
            class="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-md shadow-lg w-64 max-h-60 overflow-y-auto"
        >
            <button
                v-for="(desc, key) in variables"
                :key="key"
                type="button"
                class="w-full text-left px-3 py-1.5 hover:bg-indigo-50 text-xs border-b border-slate-100 last:border-0"
                @click="insertVariable(String(key))"
            >
                <div class="font-mono text-indigo-700 text-[11px]">{{ varToken(String(key)) }}</div>
                <div class="text-slate-500 text-[10px]">{{ desc }}</div>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
    modelValue: string
    placeholder?: string
    variables?: Record<string, string> | null
}>()
const emit = defineEmits<{ (e: 'update:modelValue', val: string): void }>()

const inputRef = ref<HTMLInputElement>()
const rootRef  = ref<HTMLElement>()
const open     = ref(false)
const caret    = ref<number>(0)

function onInput(e: Event) {
    const t = e.target as HTMLInputElement
    emit('update:modelValue', t.value)
    caret.value = t.selectionStart ?? t.value.length
}
function updateCaret() {
    if (inputRef.value) caret.value = inputRef.value.selectionStart ?? inputRef.value.value.length
}

function insertVariable(path: string) {
    const token = `{{${path}}}`
    const cur = props.modelValue ?? ''
    const pos = caret.value ?? cur.length
    const next = cur.slice(0, pos) + token + cur.slice(pos)
    emit('update:modelValue', next)
    open.value = false
    // Mover el cursor al final del token recién insertado
    requestAnimationFrame(() => {
        if (!inputRef.value) return
        const newPos = pos + token.length
        inputRef.value.focus()
        inputRef.value.setSelectionRange(newPos, newPos)
        caret.value = newPos
    })
}

function varToken(path: string): string { return '{{' + path + '}}' }

function handleClickOutside(e: MouseEvent) {
    if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
        open.value = false
    }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
