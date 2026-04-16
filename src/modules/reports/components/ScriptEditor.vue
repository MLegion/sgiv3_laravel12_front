<template>
    <div ref="hostRef" class="script-editor border border-slate-300 rounded-md overflow-hidden bg-[#282c34]" :style="{ height }"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, placeholder as placeholderExt } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'

const props = withDefaults(defineProps<{
    modelValue:  string
    placeholder?: string
    height?:     string
    readonly?:   boolean
}>(), {
    placeholder: '',
    height:      '160px',
    readonly:    false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const hostRef = ref<HTMLDivElement | null>(null)
const view    = shallowRef<EditorView | null>(null)
const readonlyComp = new Compartment()

function buildState(doc: string): EditorState {
    return EditorState.create({
        doc,
        extensions: [
            lineNumbers(),
            history(),
            bracketMatching(),
            closeBrackets(),
            indentOnInput(),
            highlightActiveLine(),
            javascript(),
            oneDark,
            placeholderExt(props.placeholder),
            keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
            readonlyComp.of(EditorState.readOnly.of(props.readonly)),
            EditorView.updateListener.of(u => {
                if (u.docChanged) {
                    const value = u.state.doc.toString()
                    if (value !== props.modelValue) emit('update:modelValue', value)
                }
            }),
            EditorView.theme({
                '&':           { fontSize: '12px' },
                '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', padding: '6px 0' },
                '.cm-scroller': { fontFamily: 'inherit' },
            }),
        ],
    })
}

onMounted(() => {
    if (!hostRef.value) return
    view.value = new EditorView({
        state:  buildState(props.modelValue ?? ''),
        parent: hostRef.value,
    })
})

onBeforeUnmount(() => {
    view.value?.destroy()
    view.value = null
})

watch(() => props.modelValue, val => {
    const v = view.value
    if (!v) return
    const current = v.state.doc.toString()
    if ((val ?? '') === current) return
    v.dispatch({
        changes: { from: 0, to: current.length, insert: val ?? '' },
    })
})

watch(() => props.readonly, ro => {
    view.value?.dispatch({
        effects: readonlyComp.reconfigure(EditorState.readOnly.of(ro)),
    })
})
</script>

<style scoped>
.script-editor :deep(.cm-editor)        { height: 100%; }
.script-editor :deep(.cm-editor.cm-focused) { outline: none; }
.script-editor :deep(.cm-scroller)      { overflow: auto; }
</style>
