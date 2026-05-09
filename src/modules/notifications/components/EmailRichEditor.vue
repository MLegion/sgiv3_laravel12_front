<template>
    <div class="email-editor border border-slate-300 rounded-md overflow-hidden bg-white">
        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
            <select
                class="text-xs px-1.5 py-1 rounded border-0 bg-transparent hover:bg-slate-200 cursor-pointer"
                :value="currentBlock"
                @change="setBlock(($event.target as HTMLSelectElement).value)"
            >
                <option value="paragraph">Párrafo</option>
                <option value="h1">Título 1</option>
                <option value="h2">Título 2</option>
                <option value="h3">Título 3</option>
            </select>

            <span class="w-px h-5 bg-slate-300 mx-1" />

            <button type="button" :class="btnClass(editor?.isActive('bold'))" title="Negrita" @click="editor?.chain().focus().toggleBold().run()">
                <span class="font-bold text-base">B</span>
            </button>
            <button type="button" :class="btnClass(editor?.isActive('italic'))" title="Cursiva" @click="editor?.chain().focus().toggleItalic().run()">
                <span class="italic font-serif text-base">I</span>
            </button>
            <button type="button" :class="btnClass(editor?.isActive('underline'))" title="Subrayado" @click="editor?.chain().focus().toggleUnderline().run()">
                <span class="underline text-base">U</span>
            </button>
            <button type="button" :class="btnClass(editor?.isActive('strike'))" title="Tachado" @click="editor?.chain().focus().toggleStrike().run()">
                <span class="line-through text-base">S</span>
            </button>

            <span class="w-px h-5 bg-slate-300 mx-1" />

            <label class="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-slate-200 cursor-pointer h-6" title="Color de texto">
                <span class="text-base font-bold">A</span>
                <input
                    type="color"
                    :value="currentColor"
                    class="w-4 h-4 border-0 cursor-pointer p-0 bg-transparent"
                    @input="setColor(($event.target as HTMLInputElement).value)"
                />
            </label>

            <span class="w-px h-5 bg-slate-300 mx-1" />

            <button type="button" :class="btnClass(editor?.isActive('bulletList'))" title="Lista con viñetas" @click="editor?.chain().focus().toggleBulletList().run()">•</button>
            <button type="button" :class="btnClass(editor?.isActive('orderedList'))" title="Lista numerada" @click="editor?.chain().focus().toggleOrderedList().run()">1.</button>

            <span class="w-px h-5 bg-slate-300 mx-1" />

            <button type="button" :class="btnClass(editor?.isActive({ textAlign: 'left' }))" title="Alinear izquierda" @click="editor?.chain().focus().setTextAlign('left').run()">
                <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h12M3 18h18"/></svg>
            </button>
            <button type="button" :class="btnClass(editor?.isActive({ textAlign: 'center' }))" title="Centrar" @click="editor?.chain().focus().setTextAlign('center').run()">
                <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M6 12h12M3 18h18"/></svg>
            </button>
            <button type="button" :class="btnClass(editor?.isActive({ textAlign: 'right' }))" title="Alinear derecha" @click="editor?.chain().focus().setTextAlign('right').run()">
                <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M9 12h12M3 18h18"/></svg>
            </button>

            <span class="w-px h-5 bg-slate-300 mx-1" />

            <button type="button" :class="btnClass(editor?.isActive('link'))" title="Enlace" @click="promptLink">
                <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1m-2 6a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>
            </button>
            <button v-if="editor?.isActive('link')" type="button" :class="btnClass(false) + ' text-red-600'" title="Quitar enlace" @click="editor?.chain().focus().unsetLink().run()">×</button>

            <span class="w-px h-5 bg-slate-300 mx-1" />

            <button type="button" :class="btnClass(false)" title="Deshacer" @click="editor?.chain().focus().undo().run()">↶</button>
            <button type="button" :class="btnClass(false)" title="Rehacer" @click="editor?.chain().focus().redo().run()">↷</button>

            <span class="flex-1" />

            <div v-if="variables && Object.keys(variables).length > 0" class="relative" ref="varsRoot">
                <button
                    type="button"
                    class="px-2 py-1 rounded hover:bg-slate-200 text-[11px] font-bold uppercase tracking-wide text-indigo-600 h-6"
                    @click="varsOpen = !varsOpen"
                >
                    + variable
                </button>
                <div
                    v-if="varsOpen"
                    class="absolute right-0 top-full mt-1 z-10 bg-white border border-slate-200 rounded-md shadow-lg w-64 max-h-60 overflow-y-auto"
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
        </div>

        <EditorContent :editor="editor" class="p-3 min-h-[220px]" />
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{
    modelValue: string
    placeholder?: string
    variables?: Record<string, string> | null
}>()
const emit = defineEmits<{ (e: 'update:modelValue', val: string): void }>()

const varsOpen = ref(false)
const varsRoot = ref<HTMLElement>()

const editor = useEditor({
    content: props.modelValue || '',
    extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Underline,
        TextStyle,
        Color,
        Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-indigo-600 underline' } }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Placeholder.configure({ placeholder: props.placeholder || 'Escribe el contenido del email...' }),
    ],
    onUpdate: ({ editor }) => emit('update:modelValue', editor.getHTML()),
})

watch(() => props.modelValue, (val) => {
    if (editor.value && val !== editor.value.getHTML()) {
        editor.value.commands.setContent(val || '', { emitUpdate: false })
    }
})

const currentBlock = computed(() => {
    if (!editor.value) return 'paragraph'
    if (editor.value.isActive('heading', { level: 1 })) return 'h1'
    if (editor.value.isActive('heading', { level: 2 })) return 'h2'
    if (editor.value.isActive('heading', { level: 3 })) return 'h3'
    return 'paragraph'
})

const currentColor = computed<string>(() => {
    const c = editor.value?.getAttributes('textStyle')?.color
    return typeof c === 'string' ? c : '#000000'
})

function setBlock(value: string) {
    if (!editor.value) return
    if (value === 'paragraph') editor.value.chain().focus().setParagraph().run()
    else editor.value.chain().focus().setHeading({ level: Number(value.replace('h', '')) as 1 | 2 | 3 }).run()
}

function setColor(value: string) {
    editor.value?.chain().focus().setColor(value).run()
}

function promptLink() {
    if (!editor.value) return
    const previous = (editor.value.getAttributes('link').href as string) || ''
    const url = window.prompt('URL del enlace (vacío para quitar):', previous)
    if (url === null) return
    if (url === '') {
        editor.value.chain().focus().unsetLink().run()
        return
    }
    const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: safe }).run()
}

function insertVariable(path: string) {
    editor.value?.chain().focus().insertContent(`{{${path}}}`).run()
    varsOpen.value = false
}

function varToken(path: string): string { return '{{' + path + '}}' }

function btnClass(active: boolean | undefined): string {
    return [
        'min-w-[26px] h-6 px-1.5 rounded text-xs flex items-center justify-center transition-colors',
        active ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-200',
    ].join(' ')
}

function handleClickOutside(e: MouseEvent) {
    if (varsRoot.value && !varsRoot.value.contains(e.target as Node)) {
        varsOpen.value = false
    }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
    editor.value?.destroy()
})
</script>

<style scoped>
.email-editor :deep(.ProseMirror) {
    outline: none;
    min-height: 200px;
}
.email-editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    color: #94a3b8;
    pointer-events: none;
    float: left;
    height: 0;
}
.email-editor :deep(.ProseMirror h1) { font-size: 1.5em; font-weight: 700; margin: .5em 0 .3em; }
.email-editor :deep(.ProseMirror h2) { font-size: 1.25em; font-weight: 700; margin: .5em 0 .3em; }
.email-editor :deep(.ProseMirror h3) { font-size: 1.1em; font-weight: 700; margin: .5em 0 .3em; }
.email-editor :deep(.ProseMirror ul) { list-style: disc; padding-left: 1.5em; }
.email-editor :deep(.ProseMirror ol) { list-style: decimal; padding-left: 1.5em; }
.email-editor :deep(.ProseMirror a) { color: #4f46e5; text-decoration: underline; }
</style>
