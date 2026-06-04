import { ref, type Ref } from 'vue'
import type {
    DataTablePagination,
    DataTableChangeEvent,
} from '@/app/components/ui/datatable/types.ts'
import { api } from '@/shared/services/api.ts'

interface UseDataTableFetchOptions {
    endpoint: string
    initialPerPage?: number

    /**
     * Campos válidos para búsqueda.
     * Se transforman en search[field]=value
     */
    searchableFields?: string[]

    /** Filtros adicionales que se fusionan con los del DataTable en search[] */
    extraSearch?: Ref<Record<string, any>>

    /**
     * Si se define, el estado de la tabla (búsqueda, orden, página, perPage) se
     * conserva en localStorage bajo esta clave y se restaura entre refreshes.
     * La carga inicial ya viene filtrada/ordenada con lo restaurado.
     */
    persistKey?: string

    mapResponse?: (response: any) => {
        items: any[]
        total: number
        page: number
        perPage: number
    }
}

interface PersistedTableState {
    search?: Record<string, string>
    sortBy?: string
    sortDirection?: 'asc' | 'desc'
    page?: number
    perPage?: number
}

function readPersisted(key?: string): PersistedTableState | null {
    if (!key) return null
    try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as PersistedTableState) : null
    } catch {
        return null
    }
}

/** Toma cualquier valor del objeto de búsqueda (todas las columnas comparten el mismo). */
function firstSearchValue(search?: Record<string, string>): string {
    if (!search) return ''
    const v = Object.values(search)[0]
    return typeof v === 'string' ? v : ''
}

export function useDataTableFetch<T>(
    options: UseDataTableFetchOptions
) {
    const rows = ref<T[]>([])
    const loading = ref(false)

    const persisted = readPersisted(options.persistKey)

    const pagination = ref<DataTablePagination>({
        page: persisted?.page ?? 1,
        perPage: persisted?.perPage ?? options.initialPerPage ?? 10,
        total: 0,
    })

    const sortBy = ref<string | undefined>(persisted?.sortBy)
    const sortDirection = ref<'asc' | 'desc' | undefined>(persisted?.sortDirection)

    const searchParams = ref<Record<string, string> | undefined>(persisted?.search)

    function persist() {
        if (!options.persistKey) return
        try {
            const state: PersistedTableState = {
                search: searchParams.value,
                sortBy: sortBy.value,
                sortDirection: sortDirection.value,
                page: pagination.value.page,
                perPage: pagination.value.perPage,
            }
            localStorage.setItem(options.persistKey, JSON.stringify(state))
        } catch {
            /* storage no disponible → ignorar */
        }
    }

    async function fetchData() {
        loading.value = true
        try {
            const response = await api.get(options.endpoint, {
                params: {
                    page: pagination.value.page,
                    per_page: pagination.value.perPage,
                    order_by: sortBy.value,
                    order_dir: sortDirection.value,
                    search: { ...(searchParams.value ?? {}), ...(options.extraSearch?.value ?? {}) },
                },
            })

            const data = options.mapResponse
                ? options.mapResponse(response.data)
                : response.data

            rows.value = data.items
            pagination.value.total = data.total
            pagination.value.page = data.page
            pagination.value.perPage = data.perPage
        } finally {
            loading.value = false
        }
    }

    function handleChange(event: DataTableChangeEvent) {
        pagination.value.page = event.page
        pagination.value.perPage = event.perPage

        sortBy.value = event.sortBy
        sortDirection.value = event.sortDirection
        if (event.search && typeof event.search === 'object') {
            searchParams.value = event.search
        } else if (event.search === undefined) {
            searchParams.value = undefined
        }

        persist()
        fetchData()
    }

    return {
        rows,
        loading,
        pagination,
        fetchData,
        handleChange,

        // Valores restaurados para hidratar el DataTable visualmente (la carga
        // inicial ya usa estos valores internamente).
        initialSearch: firstSearchValue(persisted?.search),
        initialSortBy: sortBy.value,
        initialSortDirection: sortDirection.value,
    }
}
