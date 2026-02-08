<template>
    <div class="relative space-y-1" ref="wrapper">
        <!-- Label -->
        <label
            v-if="label"
            class="text-xs font-medium text-slate-600"
        >
            {{ label }}
        </label>

        <!-- Input -->
        <div class="relative">
            <input
                type="text"
                class="w-full px-3 py-2 text-sm rounded-lg border
                       focus:outline-none focus:ring-2
                       border-slate-300 focus:ring-blue-500"
                :placeholder="placeholder"
                :value="displayValue"
                @focus="open = true"
                @input="onInput"
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
            class="absolute z-20 mt-1 w-full bg-white border
                   rounded-lg shadow-sm max-h-56 overflow-auto"
        >
            <li
                v-for="option in filteredOptions"
                :key="option[valueKey]"
                class="px-3 py-2 text-sm cursor-pointer
                       hover:bg-blue-50 hover:text-blue-700"
                @mousedown.prevent="selectOption(option)"
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

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
    error?: string
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
}

function selectOption(option: any) {
    emit('update:modelValue', option)
    search.value = ''
    open.value = false
    emit('validation-error', null)
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
