<template>
    <div class="relative space-y-1" ref="wrapper">
        <!-- Label -->
        <label
            v-if="label"
            :for="fieldId"
            class="text-xs font-medium text-slate-600"
        >
            {{ label }}
        </label>

        <!-- Input -->
        <div class="relative">
            <input
                :id="fieldId"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                :aria-expanded="open"
                :aria-controls="listboxId"
                :aria-activedescendant="open && activeIndex >= 0 ? optionId(activeIndex) : undefined"
                class="w-full px-3 py-2 text-sm rounded-lg border
                       focus:outline-none focus:ring-2
                       border-slate-300 focus:ring-blue-500"
                :placeholder="placeholder"
                :value="displayValue"
                @focus="open = true"
                @input="onInput"
                @keydown="onKeydown"
            />

            <!-- Icon -->
            <span
                class="absolute right-3 top-1/2 -translate-y-1/2
                       text-slate-400 pointer-events-none"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-4 h-4"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m21 21-5.197-5.197m0 0
                           A7.5 7.5 0 1 0 5.196 5.196
                           a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                </svg>
            </span>
        </div>

        <!-- Dropdown -->
        <ul
            v-if="open"
            :id="listboxId"
            role="listbox"
            class="absolute z-20 mt-1 w-full bg-white border
                   rounded-lg shadow-sm max-h-56 overflow-auto"
        >
            <li
                v-for="(option, i) in filteredOptions"
                :key="option[valueKey]"
                :id="optionId(i)"
                role="option"
                :aria-selected="i === activeIndex"
                class="px-3 py-2 text-sm cursor-pointer"
                :class="i === activeIndex
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-blue-50 hover:text-blue-700'"
                @mousedown.prevent="selectOption(option)"
                @mousemove="activeIndex = i"
            >
                {{ option[labelKey] }}
            </li>

            <li
                v-if="!filteredOptions.length"
                class="px-3 py-2 text-sm text-slate-400"
            >
                Sin resultados
            </li>
        </ul>

        <!-- Error -->
        <p
            v-if="error"
            class="text-xs text-red-600"
        >
            {{ error }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const fieldId = `fld-${Math.random().toString(36).slice(2, 9)}`
const listboxId = `lb-${fieldId}`
const optionId = (i: number) => `${fieldId}-opt-${i}`

/* -------------------------------------------------------------------------- */
/* PROPS */
/* -------------------------------------------------------------------------- */
const props = defineProps<{
    modelValue: any | null
    options: any[]
    label?: string
    placeholder?: string
    labelKey?: string
    valueKey?: string
    error?: string | null
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: any | null): void
    (e: 'validation-error', value: string | null): void
}>()

/* -------------------------------------------------------------------------- */
/* DEFAULT KEYS */
/* -------------------------------------------------------------------------- */
const labelKey = computed(() => props.labelKey ?? 'label')
const valueKey = computed(() => props.valueKey ?? 'id')

/* -------------------------------------------------------------------------- */
/* STATE */
/* -------------------------------------------------------------------------- */
const open = ref(false)
const search = ref('')
const wrapper = ref<HTMLElement | null>(null)
const activeIndex = ref(-1)

/* -------------------------------------------------------------------------- */
/* COMPUTED */
/* -------------------------------------------------------------------------- */
const filteredOptions = computed(() => {
    if (!search.value) return props.options

    return props.options.filter(option =>
        String(option[labelKey.value])
            .toLowerCase()
            .includes(search.value.toLowerCase())
    )
})

const displayValue = computed(() => {
    return props.modelValue
        ? props.modelValue[labelKey.value]
        : search.value
})

/* -------------------------------------------------------------------------- */
/* METHODS */
/* -------------------------------------------------------------------------- */
function onInput(e: Event) {
    search.value = (e.target as HTMLInputElement).value
    emit('update:modelValue', null)
    open.value = true
    activeIndex.value = filteredOptions.value.length ? 0 : -1
}

function selectOption(option: any) {
    emit('update:modelValue', option)
    search.value = ''
    open.value = false
    activeIndex.value = -1
    emit('validation-error', null)
}

/** Navegación por teclado del combobox (ArrowUp/Down, Enter, Escape, Home/End). */
function onKeydown(e: KeyboardEvent) {
    const count = filteredOptions.value.length

    if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!open.value) { open.value = true }
        if (count) { activeIndex.value = activeIndex.value >= count - 1 ? 0 : activeIndex.value + 1 }
        scrollActiveIntoView()
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (!open.value) { open.value = true }
        if (count) { activeIndex.value = activeIndex.value <= 0 ? count - 1 : activeIndex.value - 1 }
        scrollActiveIntoView()
    } else if (e.key === 'Home' && open.value) {
        e.preventDefault(); activeIndex.value = count ? 0 : -1; scrollActiveIntoView()
    } else if (e.key === 'End' && open.value) {
        e.preventDefault(); activeIndex.value = count ? count - 1 : -1; scrollActiveIntoView()
    } else if (e.key === 'Enter') {
        if (open.value && activeIndex.value >= 0 && activeIndex.value < count) {
            e.preventDefault()
            selectOption(filteredOptions.value[activeIndex.value])
        }
    } else if (e.key === 'Escape') {
        if (open.value) { e.preventDefault(); open.value = false; activeIndex.value = -1 }
    }
}

function scrollActiveIntoView() {
    if (activeIndex.value < 0) return
    nextTick(() => {
        document.getElementById(optionId(activeIndex.value))?.scrollIntoView({ block: 'nearest' })
    })
}

/* -------------------------------------------------------------------------- */
/* CLICK OUTSIDE */
/* -------------------------------------------------------------------------- */
function handleClickOutside(event: MouseEvent) {
    if (wrapper.value && !wrapper.value.contains(event.target as Node)) {
        open.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})

/* -------------------------------------------------------------------------- */
/* SYNC SEARCH */
/* -------------------------------------------------------------------------- */
watch(
    () => props.modelValue,
    value => {
        if (!value) return
        search.value = ''
    }
)
</script>
