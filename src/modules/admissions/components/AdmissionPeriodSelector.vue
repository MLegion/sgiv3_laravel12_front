<template>
    <div
        class="relative flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm"
        ref="containerRef"
    >
        <!-- Icon + label -->
        <div class="flex items-center gap-2 text-slate-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span class="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Periodo</span>
        </div>

        <!-- Search input -->
        <div class="relative flex-1 min-w-0">
            <input
                ref="inputRef"
                v-model="searchText"
                type="text"
                :placeholder="store.selectedPeriod ? '' : 'Buscar periodo...'"
                class="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                @focus="onFocus"
                @input="onInput"
                @keydown.esc="closeDropdown"
                @keydown.enter.prevent="selectFirst"
            />

            <!-- Nombre del periodo seleccionado (cuando no se está buscando) -->
            <div
                v-if="store.selectedPeriod && !isSearching"
                class="absolute inset-0 flex items-center px-2 pointer-events-none"
            >
                <span class="text-sm text-slate-700 font-medium truncate">
                    {{ store.selectedPeriod.name ?? store.selectedPeriod.academicPeriod?.name ?? `Periodo #${store.selectedPeriod.academicPeriodId}` }}
                </span>
            </div>

            <!-- Spinner -->
            <div v-if="loading" class="absolute right-2 top-1/2 -translate-y-1/2">
                <div class="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
        </div>

        <!-- Status badge -->
        <span
            v-if="store.selectedPeriod"
            class="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
            :class="statusClass"
        >
            {{ store.selectedPeriod.statusLabel }}
        </span>

        <!-- Clear -->
        <button
            v-if="store.selectedPeriodId"
            class="shrink-0 text-slate-300 hover:text-slate-500 transition"
            title="Todos los periodos"
            @click="clearSelection"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <!-- Dropdown -->
        <div
            v-if="open"
            class="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
            style="min-width: 100%"
        >
            <div class="max-h-60 overflow-y-auto">
                <!-- Opción "Todos" -->
                <div
                    class="px-4 py-2.5 text-xs text-slate-400 italic cursor-pointer hover:bg-slate-50 border-b"
                    @mousedown.prevent="clearAndClose"
                >
                    — Todos los periodos —
                </div>

                <div
                    v-for="period in results"
                    :key="period.academicPeriodId"
                    class="flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 group"
                    @mousedown.prevent="selectPeriod(period)"
                >
                    <span class="font-semibold text-slate-700 group-hover:text-blue-700 truncate">
                        {{ period.name ?? period.academicPeriod?.name ?? `Periodo #${period.academicPeriodId}` }}
                    </span>
                    <span
                        class="shrink-0 ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                        :class="STATUS_CLASSES[period.status as AcademicPeriodStatus] ?? 'bg-slate-100 text-slate-500'"
                    >
                        {{ period.statusLabel }}
                    </span>
                </div>

                <div v-if="!loading && results.length === 0" class="px-4 py-6 text-center text-xs text-slate-400">
                    Sin resultados
                </div>

                <button
                    v-if="canLoadMore"
                    type="button"
                    class="w-full px-4 py-2 text-xs font-semibold text-blue-600 bg-slate-50 hover:bg-blue-50 transition border-t"
                    @mousedown.prevent="loadMore"
                >
                    Cargar más
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { CollegeAcademicPeriod, AcademicPeriodStatus } from '@/modules/school-services/types/college-academic-period.type'
import { STATUS_CLASSES } from '@/modules/school-services/types/college-academic-period.type'
import { useAdmissionPeriodStore } from '@/modules/admissions/stores/admission-period.store'

const emit = defineEmits<{ change: [] }>()

const store      = useAdmissionPeriodStore()
const containerRef = ref<HTMLElement | null>(null)
const inputRef   = ref<HTMLInputElement | null>(null)
const open       = ref(false)
const loading    = ref(false)
const searchText = ref('')
const isSearching = ref(false)
const results    = ref<CollegeAcademicPeriod[]>([])
const page       = ref(1)
const lastPage   = ref(1)
let debounce: ReturnType<typeof setTimeout> | null = null

const statusClass = computed(() =>
    store.selectedPeriod ? STATUS_CLASSES[store.selectedPeriod.status as AcademicPeriodStatus] ?? '' : ''
)
const canLoadMore = computed(() => page.value < lastPage.value)

async function fetchPeriods(reset = false) {
    loading.value = true
    if (reset) { page.value = 1; results.value = [] }
    try {
        const searchParam = searchText.value.trim()
            ? { name: searchText.value.trim() }
            : {}
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, {
            params: {
                page: page.value,
                per_page: 8,
                order_by: 'actual_start_date',
                order_dir: 'desc',
                search: searchParam,
            },
        })
        const items: CollegeAcademicPeriod[] = data.items ?? []
        results.value.push(...items)
        lastPage.value = data.lastPage ?? 1
    } catch {
        results.value = []
    } finally {
        loading.value = false
    }
}

async function autoSelectFromConfig() {
    if (store.selectedPeriodId !== null) return
    try {
        const { data } = await api.get(API.ADMISSIONS_API.config.get)
        const periodId: number | null = data?.academicPeriodId ?? null
        if (!periodId) return

        const { data: listData } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, {
            params: { per_page: 1, search: { academic_period_id: periodId } },
        })
        const found: CollegeAcademicPeriod | undefined = listData?.items?.[0]
        if (found) {
            store.select(found)
            emit('change')
        }
    } catch {
        // no config or error — keep no selection
    }
}

function onFocus() {
    isSearching.value = true
    open.value = true
    if (results.value.length === 0) fetchPeriods(true)
}

function onInput() {
    isSearching.value = true
    open.value = true
    if (debounce) clearTimeout(debounce)
    debounce = setTimeout(() => fetchPeriods(true), 350)
}

function selectPeriod(period: CollegeAcademicPeriod) {
    store.select(period)
    searchText.value = ''
    isSearching.value = false
    closeDropdown()
    emit('change')
}

function selectFirst() {
    if (results.value.length > 0) selectPeriod(results.value[0])
}

function clearSelection() {
    store.clear()
    searchText.value = ''
    isSearching.value = false
    emit('change')
}

function clearAndClose() {
    clearSelection()
    closeDropdown()
}

function loadMore() {
    if (!loading.value && canLoadMore.value) {
        page.value++
        fetchPeriods()
    }
}

function closeDropdown() {
    open.value = false
    isSearching.value = false
    searchText.value = ''
}

const handleClickOutside = (e: MouseEvent) => {
    if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
        closeDropdown()
    }
}

onMounted(async () => {
    document.addEventListener('click', handleClickOutside)
    await autoSelectFromConfig()
})

onBeforeUnmount(() => {
    if (debounce) clearTimeout(debounce)
    document.removeEventListener('click', handleClickOutside)
})
</script>

