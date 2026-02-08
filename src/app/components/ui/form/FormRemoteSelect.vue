<template>
    <div class="space-y-1.5 relative w-full" ref="containerRef">
        <label
            v-if="label"
            class="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider"
        >
            {{ label }}
        </label>

        <div class="relative">
            <input
                type="text"
                :value="search"
                :placeholder="placeholder"
                :class="inputClasses"
                :disabled="disabled"
                @focus="onFocus"
                @input="onInput"
                @keydown.esc="closeDropdown"
            />

            <div v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2">
                <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>

            <div v-else-if="selectedItem" class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                <CheckCircleIcon class="w-5 h-5" />
            </div>
        </div>

        <!-- Lista de Sugerencias con Posicionamiento Fijo (Anti-recorte de Modales) -->
        <div
            v-if="open && !disabled && (items.length > 0 || !loading)"
            class="fixed z-[9999] bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden transition-all duration-200 flex flex-col"
            :style="dropdownStyle"
        >
            <div
                v-if="isRecommendationMode && items.length"
                class="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100"
            >
                Recomendaciones
            </div>

            <div class="max-h-60 overflow-y-auto divide-y divide-slate-50">
                <div
                    v-for="item in items"
                    :key="item[itemValue]"
                    class="px-4 py-3 text-xs cursor-pointer transition-colors hover:bg-blue-50 group"
                    @mousedown="select(item)"
                >
                    <div class="flex flex-col">
                        <span class="font-bold text-slate-700 group-hover:text-blue-700 uppercase">
                            {{ item[itemLabel] }}
                        </span>
                        <span v-if="item.officialCode" class="text-[10px] font-mono text-slate-400">
                            {{ item.officialCode }}
                        </span>
                    </div>
                </div>

                <div
                    v-if="!loading && items.length === 0"
                    class="p-6 text-center"
                >
                    <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin resultados</p>
                </div>

                <button
                    v-if="canLoadMore && !isRecommendationMode"
                    type="button"
                    class="w-full px-3 py-3 text-[10px] font-black text-blue-600 bg-slate-50 hover:bg-blue-100 transition-colors uppercase border-t border-slate-100"
                    @mousedown.stop.prevent="loadMore"
                >
                    Cargar más resultados
                </button>
            </div>
        </div>

        <!-- Validaciones de estado -->
        <div class="flex justify-between items-center px-1 min-h-[16px]">
            <p v-if="selectedItem" class="text-[10px] text-green-600 flex items-center gap-1 font-bold uppercase tracking-tight">
                <span>✔ Selección válida</span>
            </p>
            <p v-else-if="required && !loading && !search" class="text-[10px] text-red-500 font-bold uppercase tracking-tight">
                * Campo obligatorio
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue'
import { CheckCircleIcon } from '@heroicons/vue/24/solid'
import { api } from '@/shared/services/api'

interface Props {
    modelValue: number | string | null
    endpoint: string
    endpointById?: (id: number | string) => string
    params?: Record<string, any>
    label?: string
    placeholder?: string
    itemLabel: string
    itemValue: string
    required?: boolean
    disabled?: boolean
    uppercase?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Buscar...',
    required: false,
    disabled: false,
    uppercase: false,
    params: () => ({})
})

const emit = defineEmits(['update:modelValue'])

/* -------------------------------------------------------------------------- */
/* STATE */
/* -------------------------------------------------------------------------- */
const containerRef = ref<HTMLElement | null>(null)
const open = ref(false)
const loading = ref(false)
const search = ref('')
const selectedItem = ref<any | null>(null)
const items = ref<any[]>([])
const page = ref(1)
const lastPage = ref(1)
const dropdownStyle = ref({ top: '0px', left: '0px', width: '0px' })

let debounceTimeout: ReturnType<typeof setTimeout> | null = null

/* -------------------------------------------------------------------------- */
/* COMPUTED */
/* -------------------------------------------------------------------------- */
const isRecommendationMode = computed(() => search.value.trim() === '')

const inputClasses = computed(() => [
    'w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all outline-none',
    props.disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100' : '',
    selectedItem.value
        ? 'border-green-500 bg-green-50/20 focus:ring-4 focus:ring-green-100'
        : props.required && !search.value
            ? 'border-red-200 focus:ring-4 focus:ring-red-50'
            : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50',
])

const canLoadMore = computed(() => page.value < lastPage.value)

/* -------------------------------------------------------------------------- */
/* DROPDOWN POSITION LOGIC */
/* -------------------------------------------------------------------------- */
const updateDropdownPosition = () => {
    if (containerRef.value) {
        const rect = containerRef.value.getBoundingClientRect()
        // Buscamos el input dentro del contenedor para mayor precisión
        const inputEl = containerRef.value.querySelector('input')
        const inputRect = inputEl ? inputEl.getBoundingClientRect() : rect

        dropdownStyle.value = {
            top: `${inputRect.bottom + 4}px`,
            left: `${inputRect.left}px`,
            width: `${inputRect.width}px`
        }
    }
}

/* -------------------------------------------------------------------------- */
/* API METHODS */
/* -------------------------------------------------------------------------- */
async function fetchList(reset = false) {
    if (props.disabled) return

    loading.value = true
    if (reset) {
        page.value = 1
        items.value = []
    }

    try {
        const { data } = await api.get(props.endpoint, {
            params: {
                page: page.value,
                per_page: isRecommendationMode.value ? 5 : 10,
                search: isRecommendationMode.value
                    ? {}
                    : { [props.itemLabel]: search.value },
                ...props.params
            },
        })

        // Adaptación según estructura de respuesta
        const newItems = data.items || data.data || data
        const totalPages = data.lastPage || data.last_page || 1

        items.value.push(...(Array.isArray(newItems) ? newItems : []))
        lastPage.value = totalPages

        if (open.value) updateDropdownPosition()
    } catch (error) {
        console.error("Error fetching remote list:", error)
    } finally {
        loading.value = false
    }
}

async function autoResolve(id: number | string | null) {
    if (!id) {
        selectedItem.value = null
        search.value = ''
        return
    }

    if (selectedItem.value && String(selectedItem.value[props.itemValue]) === String(id)) {
        return
    }

    if (props.endpointById) {
        loading.value = true
        try {
            const { data } = await api.get(props.endpointById(id))
            selectedItem.value = data
            search.value = data[props.itemLabel]
        } catch (error) {
            console.error("Error auto-resolving ID:", error)
            selectedItem.value = null
        } finally {
            loading.value = false
        }
    }
}

/* -------------------------------------------------------------------------- */
/* EVENTS */
/* -------------------------------------------------------------------------- */
function onInput(e: Event) {
    let value = (e.target as HTMLInputElement).value
    if (props.uppercase) value = value.toUpperCase()
    search.value = value
}

function onFocus() {
    if (props.disabled) return
    open.value = true
    updateDropdownPosition()
    if (items.value.length === 0) fetchList(true)

    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
}

function select(item: any) {
    selectedItem.value = item
    search.value = item[props.itemLabel]
    emit('update:modelValue', item[props.itemValue])
    closeDropdown()
}

function loadMore() {
    if (!loading.value && canLoadMore.value) {
        page.value++
        fetchList()
    }
}

function closeDropdown() {
    open.value = false
    window.removeEventListener('scroll', updateDropdownPosition, true)
    window.removeEventListener('resize', updateDropdownPosition)
}

/* -------------------------------------------------------------------------- */
/* WATCHERS */
/* -------------------------------------------------------------------------- */
watch(() => props.modelValue, (newVal) => {
    autoResolve(newVal)
}, { immediate: true })

watch(search, (newVal) => {
    if (selectedItem.value && newVal === selectedItem.value[props.itemLabel]) return

    if (newVal === '') {
        selectedItem.value = null
        emit('update:modelValue', null)
    }

    if (debounceTimeout) clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(() => {
        fetchList(true)
    }, 400)
})

/* -------------------------------------------------------------------------- */
/* LIFECYCLE & OUTSIDE CLICK */
/* -------------------------------------------------------------------------- */
const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
        closeDropdown()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout)
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('scroll', updateDropdownPosition, true)
    window.removeEventListener('resize', updateDropdownPosition)
})

</script>
