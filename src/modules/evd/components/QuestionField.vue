<script setup lang="ts">
import { computed } from 'vue'

interface Option { id: number; label: string; position: number; value: number | null }
interface Question {
    id: number
    type: string
    statement: string
    position: number
    required: boolean
    options: Option[]
}
interface Selection { option_id?: number; selected_option_ids?: number[]; text?: string; scalar?: number }

const props = defineProps<{ question: Question; selection?: Selection; questionStyle?: string }>()
const emit = defineEmits<{ (e: 'update', value: Selection): void }>()

const sel = computed<Selection>(() => props.selection ?? {})

// Estilo del enunciado, configurable por formulario (form.config.question_style).
const STATEMENT_STYLES: Record<string, string> = {
    default: 'text-sm text-slate-800',
    clear:   'text-base font-semibold text-slate-900',
    large:   'text-lg font-bold text-slate-900',
}
const statementClass = computed(() => STATEMENT_STYLES[props.questionStyle ?? 'default'] ?? STATEMENT_STYLES.default)

function isSelected(oid: number): boolean {
    const a = sel.value
    if (a.option_id === oid) return true
    if (Array.isArray(a.selected_option_ids) && a.selected_option_ids.includes(oid)) return true
    return false
}

function selectOption(oid: number) {
    if (props.question.type === 'multiple_choice_multi') {
        const cur = (sel.value.selected_option_ids ?? []) as number[]
        const next = cur.includes(oid) ? cur.filter(x => x !== oid) : [...cur, oid]
        emit('update', { selected_option_ids: next })
    } else {
        emit('update', { option_id: oid })
    }
}
</script>

<template>
    <div class="border-l-2 border-slate-200 pl-3">
        <p class="mb-2" :class="statementClass">
            <span class="font-mono text-xs text-slate-400 mr-2 font-normal">#{{ question.position }}</span>
            {{ question.statement }}
            <span v-if="question.required" class="text-rose-500 ml-1">*</span>
        </p>

        <div v-if="question.type === 'multiple_choice_single' || question.type === 'multiple_choice_multi' || question.type === 'true_false'"
             class="flex flex-wrap gap-2 pl-1">
            <label
                v-for="o in question.options"
                :key="o.id"
                class="flex items-center gap-2 text-sm cursor-pointer p-2 rounded border flex-1 basis-40 min-w-40"
                :class="isSelected(o.id) ? 'bg-emerald-50 border-emerald-300' : 'border-slate-200 hover:bg-slate-50'"
            >
                <input
                    v-if="question.type === 'multiple_choice_multi'"
                    type="checkbox"
                    :checked="isSelected(o.id)"
                    @change="selectOption(o.id)"
                />
                <input
                    v-else
                    type="radio"
                    :name="`q-${question.id}`"
                    :checked="isSelected(o.id)"
                    @change="selectOption(o.id)"
                />
                <span class="flex-1 text-slate-700">{{ o.label }}</span>
            </label>
        </div>

        <div v-else-if="question.type === 'open_short'" class="pl-1">
            <input
                :value="sel.text ?? ''"
                type="text"
                class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                placeholder="Tu respuesta…"
                @input="(e: any) => emit('update', { text: e.target.value })"
            />
        </div>

        <div v-else-if="question.type === 'open_long'" class="pl-1">
            <textarea
                :value="sel.text ?? ''"
                rows="3"
                class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                placeholder="Tu respuesta…"
                @input="(e: any) => emit('update', { text: e.target.value })"
            />
        </div>

        <div v-else-if="question.type === 'scale'" class="pl-1">
            <input
                :value="sel.scalar ?? 0"
                type="range"
                min="0" max="10" step="1"
                class="w-full"
                @input="(e: any) => emit('update', { scalar: Number(e.target.value) })"
            />
            <div class="text-xs text-slate-500 mt-1">Valor: {{ sel.scalar ?? 0 }}</div>
        </div>

        <div v-else class="text-xs text-slate-400 italic">
            Tipo no soportado: {{ question.type }}
        </div>
    </div>
</template>
