<script setup lang="ts" generic="T">
import { computed, ref, watch } from 'vue'
import type {
    DataTableProps,
    DataTableEmits,
    DataTableColumn,
    DataTableExportType,
} from './types.ts'
import TableSkeletonRow from './TableSkeletonRow.vue'

/* -------------------------------------------------------------------------- */
/* PROPS & EMITS */
/* -------------------------------------------------------------------------- */
const props = defineProps<DataTableProps<T>>()
const emit = defineEmits<DataTableEmits<T>>()

/* -------------------------------------------------------------------------- */
/* STATE */
/* -------------------------------------------------------------------------- */
const sortBy = ref<string | undefined>(props.sortBy)
const sortDirection = ref<'asc' | 'desc' | undefined>(props.sortDirection)
const search = ref('')
let searchTimeout: any = null

/* -------------------------------------------------------------------------- */
/* COMPUTED */
/* -------------------------------------------------------------------------- */
const visibleColumns = computed(() => props.columns)
const optionsPerPage = computed(() => props.perPageOptions ?? [10, 25, 50, 100])

/* -------------------------------------------------------------------------- */
/* HELPERS */
/* -------------------------------------------------------------------------- */
const getCellValue = (row: any, col: DataTableColumn<T>) => {
    const field = (col.field as string) || col.key
    if (!field) return ''
    if (field.includes('.')) {
        return field.split('.').reduce((acc, part) => acc && acc[part], row)
    }
    return row[field]
}

const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable || props.loading) return
    if (sortBy.value === column.key) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : undefined
        if (!sortDirection.value) sortBy.value = undefined
    } else {
        sortBy.value = column.key
        sortDirection.value = 'asc'
    }
    triggerChange()
}

const triggerChange = () => {
    emit('change', {
        page: props.pagination?.page ?? 1,
        perPage: props.pagination?.perPage ?? 10,
        sortBy: sortBy.value,
        sortDirection: sortDirection.value,
        search: search.value ? { all: search.value } : undefined
    })
}

watch(search, (val) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => triggerChange(), 500)
})

const onExport = (type: DataTableExportType) => {
    emit('export', { type, rows: props.rows, columns: props.columns })
}
</script>

<template>
    <div class="w-full flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

        <!-- Toolbar: Búsqueda y Exportación -->
        <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
            <div class="relative w-full sm:max-w-sm">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input
                    v-model="search"
                    type="text"
                    :placeholder="searchPlaceholder || 'Buscar registros...'"
                    class="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                />
            </div>

            <div v-if="exportable?.length" class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button
                    v-for="type in exportable" :key="type"
                    @click="onExport(type)"
                    class="whitespace-nowrap px-3 py-1.5 border border-slate-200 rounded-md text-[11px] font-bold uppercase text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                    <svg class="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {{ type }}
                </button>
            </div>
        </div>

        <!-- Tabla con Scrollbar Mejorado -->
        <div class="overflow-x-auto w-full custom-scrollbar">
            <table class="min-w-full border-collapse text-left text-sm">
                <thead>
                <tr class="bg-slate-50/50 border-b border-slate-200">
                    <th
                        v-for="col in visibleColumns" :key="col.key"
                        @click="handleSort(col)"
                        class="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider whitespace-nowrap"
                        :class="[col.sortable ? 'cursor-pointer hover:text-blue-600 select-none' : '', `text-${col.align || 'left'}`]"
                        :style="{ width: col.width }"
                    >
                        <div class="flex items-center gap-2" :class="{'justify-end': col.align === 'right', 'justify-center': col.align === 'center'}">
                            <span>{{ col.label }}</span>
                            <div v-if="col.sortable" class="flex flex-col text-[8px] leading-[4px]">
                                <span :class="sortBy === col.key && sortDirection === 'asc' ? 'text-blue-600 opacity-100' : 'opacity-30'">▲</span>
                                <span :class="sortBy === col.key && sortDirection === 'desc' ? 'text-blue-600 opacity-100' : 'opacity-30'">▼</span>
                            </div>
                        </div>
                    </th>
                </tr>
                </thead>

                <tbody class="divide-y divide-slate-100">
                <template v-if="loading">
                    <TableSkeletonRow v-for="i in 5" :key="i" :columns="visibleColumns.length" />
                </template>

                <template v-else-if="rows.length > 0">
                    <tr v-for="(row, rowIndex) in rows" :key="rowIndex" class="hover:bg-blue-50/30 transition-colors">
                        <td
                            v-for="col in visibleColumns" :key="col.key"
                            class="px-4 py-3 text-slate-600 whitespace-nowrap"
                            :class="[`text-${col.align || 'left'}`]"
                        >
                            <!-- SLOT IDENTIFIER: cell-key -->
                            <slot
                                :name="'cell-' + col.key"
                                v-bind="{ row, value: getCellValue(row, col), index: rowIndex }"
                            >
                                <template v-if="col.formatter">
                                    {{ col.formatter(getCellValue(row, col), row) }}
                                </template>
                                <template v-else>
                                    {{ getCellValue(row, col) }}
                                </template>
                            </slot>
                        </td>
                    </tr>
                </template>

                <tr v-else>
                    <td :colspan="visibleColumns.length" class="py-16 text-center">
                        <div class="flex flex-col items-center text-slate-400">
                            <p class="text-sm italic">{{ emptyText || 'No se encontraron datos' }}</p>
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>

        <!-- Paginación -->
        <div v-if="pagination" class="p-4 border-t border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center justify-between w-full sm:w-auto gap-3 text-xs text-slate-500 font-medium">
                <div class="flex items-center gap-2">
                    <span class="hidden xs:inline">Mostrar</span>
                    <select
                        :value="pagination.perPage"
                        @change="(e) => emit('change', { ...pagination!, perPage: Number((e.target as HTMLSelectElement).value), page: 1 })"
                        class="bg-white border border-slate-200 rounded px-2 py-1.5 outline-none"
                    >
                        <option v-for="n in optionsPerPage" :key="n" :value="n">{{ n }}</option>
                    </select>
                </div>
                <span>{{ (pagination.page - 1) * pagination.perPage + 1 }} - {{ Math.min(pagination.page * pagination.perPage, pagination.total) }} de {{ pagination.total }}</span>
            </div>

            <div class="flex items-center gap-1 w-full sm:w-auto">
                <button
                    @click="emit('change', { ...pagination!, page: pagination.page - 1 })"
                    :disabled="pagination.page <= 1 || loading"
                    class="flex-1 sm:flex-none px-4 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-all text-xs font-bold"
                >
                    Anterior
                </button>
                <div class="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-md border border-blue-100 min-w-[40px] text-center">
                    {{ pagination.page }}
                </div>
                <button
                    @click="emit('change', { ...pagination!, page: pagination.page + 1 })"
                    :disabled="pagination.page >= Math.ceil(pagination.total / pagination.perPage) || loading"
                    class="flex-1 sm:flex-none px-4 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-all text-xs font-bold"
                >
                    Siguiente
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Estilos para que la barra de scroll sea más amigable en dispositivos táctiles */
.custom-scrollbar::-webkit-scrollbar {
    height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9; /* slate-100 */
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1; /* slate-300 */
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8; /* slate-400 */
}

/* En móviles, forzamos que la barra sea un poco más visible */
@media (max-width: 768px) {
    .custom-scrollbar {
        -webkit-overflow-scrolling: touch;
        padding-bottom: 4px; /* Espacio para que el scroll no tape el contenido */
    }
}
</style>
