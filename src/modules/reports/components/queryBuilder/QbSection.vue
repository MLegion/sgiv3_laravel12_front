<template>
    <section class="border-2 rounded-lg overflow-hidden" :class="borderClass">
        <button
            type="button"
            class="w-full px-4 py-2.5 flex items-center justify-between text-left transition"
            :class="headerClass"
            @click="open = !open"
        >
            <div class="flex items-center gap-2">
                <span class="text-xs font-black uppercase tracking-wider" :class="titleClass">{{ title }}</span>
                <span
                    v-if="count !== undefined && count > 0"
                    class="text-[10px] font-black px-1.5 py-0.5 rounded"
                    :class="countClass"
                >
                    {{ count }}
                </span>
            </div>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 transition-transform"
                :class="[titleClass, open ? 'rotate-180' : '']"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.5"
                stroke="currentColor"
            >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
        </button>

        <div v-if="open" class="p-3 bg-white">
            <slot />
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

type Color = 'blue' | 'purple' | 'green' | 'amber' | 'cyan' | 'indigo' | 'rose' | 'slate'

const props = withDefaults(defineProps<{
    title: string
    color?: Color
    count?: number
    open?: boolean
    collapsed?: boolean
}>(), {
    color: 'slate',
    count: undefined,
    open: undefined,
    collapsed: false,
})

const open = ref(props.open ?? !props.collapsed)

const borderClass = computed(() => ({
    blue:   'border-blue-300',
    purple: 'border-purple-300',
    green:  'border-green-300',
    amber:  'border-amber-300',
    cyan:   'border-cyan-300',
    indigo: 'border-indigo-300',
    rose:   'border-rose-300',
    slate:  'border-slate-300',
}[props.color]))

const headerClass = computed(() => ({
    blue:   'bg-blue-50 hover:bg-blue-100',
    purple: 'bg-purple-50 hover:bg-purple-100',
    green:  'bg-green-50 hover:bg-green-100',
    amber:  'bg-amber-50 hover:bg-amber-100',
    cyan:   'bg-cyan-50 hover:bg-cyan-100',
    indigo: 'bg-indigo-50 hover:bg-indigo-100',
    rose:   'bg-rose-50 hover:bg-rose-100',
    slate:  'bg-slate-50 hover:bg-slate-100',
}[props.color]))

const titleClass = computed(() => ({
    blue:   'text-blue-800',
    purple: 'text-purple-800',
    green:  'text-green-800',
    amber:  'text-amber-800',
    cyan:   'text-cyan-800',
    indigo: 'text-indigo-800',
    rose:   'text-rose-800',
    slate:  'text-slate-800',
}[props.color]))

const countClass = computed(() => ({
    blue:   'bg-blue-500 text-white',
    purple: 'bg-purple-500 text-white',
    green:  'bg-green-500 text-white',
    amber:  'bg-amber-500 text-white',
    cyan:   'bg-cyan-500 text-white',
    indigo: 'bg-indigo-500 text-white',
    rose:   'bg-rose-500 text-white',
    slate:  'bg-slate-500 text-white',
}[props.color]))
</script>
