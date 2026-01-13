<script setup lang="ts" generic="T">
import { computed, ref, watch } from 'vue'
import type {
    DataTableProps,
    DataTableEmits,
    DataTableColumn,
    DataTableExportType,
} from './types'

const props = defineProps<DataTableProps<T>>()
const emit = defineEmits<DataTableEmits<T>>()

/**
 * Columnas visibles
 */
const visibleColumns = computed<DataTableColumn<T>[]>(() => {
    return props.columns
})

/**
 * Opciones de registros por página
 */
const perPageOptions = computed(() => {
    return props.perPageOptions ?? [10, 15, 25, 50]
})

/**
 * Estado visual de ordenamiento
 */
const sortBy = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc' | null>(null)

/**
 * Search global (input único)
 */
const search = ref('')

let searchTimeout: number | undefined

watch(search, value => {
    if (searchTimeout) {
        clearTimeout(searchTimeout)
    }

    searchTimeout = window.setTimeout(() => {
        emit('change', {
            page: 1,
            perPage: props.pagination?.perPage ?? perPageOptions.value[0],
            sortBy: sortBy.value ?? undefined,
            sortDirection: sortDirection.value ?? undefined,
            search: value || undefined,
        })
    }, 400)
})

/**
 * PerPage controlado (source of truth: parent)
 */
const currentPerPage = computed({
    get: () => props.pagination?.perPage ?? perPageOptions.value[0],
    set: (value: number) => {
        emit('change', {
            page: 1,
            perPage: value,
            sortBy: sortBy.value ?? undefined,
            sortDirection: sortDirection.value ?? undefined,
            search: search.value || undefined,
        })
    },
})


const searchPlaceholder = computed(() => {
    return props.searchPlaceholder ?? 'Buscar…'
})

/**
 * Toggle de ordenamiento por columna
 */
function toggleSort(column: DataTableColumn<T>) {
    if (!column.sortable) return

    if (sortBy.value !== column.key) {
        sortBy.value = column.key
        sortDirection.value = 'asc'
    } else if (sortDirection.value === 'asc') {
        sortDirection.value = 'desc'
    } else {
        sortBy.value = null
        sortDirection.value = null
    }

    emit('change', {
        page: 1,
        perPage: props.pagination?.perPage ?? perPageOptions.value[0],
        sortBy: sortBy.value ?? undefined,
        sortDirection: sortDirection.value ?? undefined,
        search: search.value || undefined,
    })
}

/**
 * Exportación solicitada
 */
function handleExport(type: DataTableExportType) {
    emit('export', {
        type,
        rows: props.rows,
        columns: props.columns.filter(c => c.exportable !== false),
    })
}

/**
 * Handler del dropdown de exportación
 * (siempre vuelve a "Exportar")
 */
function onExportSelect(event: Event) {
    const select = event.target as HTMLSelectElement
    const type = select.value as DataTableExportType

    if (!type) return

    handleExport(type)
    select.selectedIndex = 0
}
</script>

<template>
    <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <!-- Toolbar -->
        <div
            class="flex items-center justify-between px-4 py-3 border-b border-slate-200"
        >
            <!-- Toolbar izquierda -->
            <div class="flex items-center gap-2">
                <input
                    v-model="search"
                    type="text"
                    :placeholder="searchPlaceholder"
                    class="border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    :disabled="loading"
                />

                <slot name="toolbar-left" />
            </div>

            <!-- Toolbar derecha -->
            <div class="flex items-center gap-2">
                <slot name="toolbar-right" />

                <!-- Export dropdown -->
                <div v-if="exportable?.length">
                    <select
                        class="border rounded-lg px-3 py-1.5 text-xs bg-white
                               hover:bg-slate-50 transition cursor-pointer"
                        @change="onExportSelect"
                        :disabled="loading"
                    >
                        <option value="">
                            Exportar
                        </option>

                        <option
                            v-for="type in exportable"
                            :key="type"
                            :value="type"
                        >
                            {{ type.toUpperCase() }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Tabla -->
        <div class="overflow-x-auto relative">
            <!-- Loading overlay -->
            <div
                v-if="loading"
                class="absolute inset-0 bg-white/70 flex items-center
                       justify-center z-10 pointer-events-none"
            >
                <span class="text-sm text-slate-500">
                    Cargando…
                </span>
            </div>

            <table class="min-w-full border-collapse">
                <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th
                        v-for="col in visibleColumns"
                        :key="col.key"
                        class="px-4 py-2 text-xs font-semibold
                                   text-slate-600 whitespace-nowrap select-none"
                        :class="{
                                'cursor-pointer hover:text-slate-900': col.sortable,
                            }"
                        :style="{ width: col.width }"
                        @click="toggleSort(col)"
                    >
                        <div class="flex items-center gap-1">
                            <span>{{ col.label }}</span>

                            <span
                                v-if="col.sortable"
                                class="text-slate-400"
                            >
                                    <span v-if="sortBy !== col.key">⇅</span>
                                    <span v-else-if="sortDirection === 'asc'">↑</span>
                                    <span v-else-if="sortDirection === 'desc'">↓</span>
                                </span>
                        </div>
                    </th>
                </tr>
                </thead>

                <tbody>
                <!-- Empty -->
                <tr v-if="!loading && !rows.length">
                    <td
                        :colspan="visibleColumns.length"
                        class="px-4 py-6 text-center text-sm text-slate-500"
                    >
                        {{ emptyText || 'No hay registros' }}
                    </td>
                </tr>

                <!-- Rows -->
                <tr
                    v-for="(row, rowIndex) in rows"
                    :key="rowIndex"
                    class="border-b border-slate-100
                               hover:bg-slate-50 transition"
                >
                    <td
                        v-for="col in visibleColumns"
                        :key="col.key"
                        class="px-4 py-2 text-sm text-slate-700"
                        :class="{
                                'text-center': col.align === 'center',
                                'text-right': col.align === 'right',
                            }"
                    >
                        <slot
                            :name="`cell-${col.key}`"
                            :row="row"
                            :value="(row as any)[col.field as string]"
                        >
                                <span>
                                    {{
                                        col.formatter
                                            ? col.formatter(
                                                (row as any)[col.field as string],
                                                row
                                            )
                                            : (row as any)[col.field as string]
                                    }}
                                </span>
                        </slot>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>

        <!-- Footer / Pagination -->
        <div
            v-if="pagination"
            class="flex flex-col sm:flex-row sm:items-center
                   sm:justify-between gap-3 px-4 py-3
                   border-t border-slate-200 text-xs text-slate-600"
        >
            <!-- Info -->
            <div>
                Página {{ pagination.page }} de
                {{ Math.ceil(pagination.total / pagination.perPage) }}
                ({{ pagination.total }} registros)
            </div>

            <div class="flex items-center gap-3">
                <!-- Per page selector -->
                <div class="flex items-center gap-1">
                    <span>Mostrar</span>
                    <select
                        v-model="currentPerPage"
                        class="border rounded px-2 py-1 text-xs"
                        :disabled="loading"
                    >
                        <option
                            v-for="opt in perPageOptions"
                            :key="opt"
                            :value="opt"
                        >
                            {{ opt }}
                        </option>
                    </select>
                </div>

                <!-- Pagination buttons -->
                <button
                    class="px-2 py-1 border rounded hover:bg-slate-100"
                    :disabled="loading || pagination.page <= 1"
                    @click="
                        emit('change', {
                            page: pagination.page - 1,
                            perPage: pagination.perPage,
                            sortBy: sortBy ?? undefined,
                            sortDirection: sortDirection ?? undefined,
                            search: search || undefined,
                        })
                    "
                >
                    Anterior
                </button>

                <button
                    class="px-2 py-1 border rounded hover:bg-slate-100"
                    :disabled="
                        loading ||
                        pagination.page >=
                        Math.ceil(pagination.total / pagination.perPage)
                    "
                    @click="
                        emit('change', {
                            page: pagination.page + 1,
                            perPage: pagination.perPage,
                            sortBy: sortBy ?? undefined,
                            sortDirection: sortDirection ?? undefined,
                            search: search || undefined,
                        })
                    "
                >
                    Siguiente
                </button>
            </div>
        </div>
    </div>
</template>
