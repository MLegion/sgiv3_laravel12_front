import { ref } from 'vue'
import type {
    DataTablePagination,
    DataTableChangeEvent,
} from '@/app/components/datatable/types'
import { api } from '@/shared/services/api'

interface UseDataTableFetchOptions {
    endpoint: string
    initialPerPage?: number

    /**
     * Campos válidos para búsqueda.
     * Se transforman en search[field]=value
     */
    searchableFields?: string[]

    mapResponse?: (response: any) => {
        items: any[]
        total: number
        page: number
        perPage: number
    }
}

export function useDataTableFetch<T>(
    options: UseDataTableFetchOptions
) {
    const rows = ref<T[]>([])
    const loading = ref(false)

    const pagination = ref<DataTablePagination>({
        page: 1,
        perPage: options.initialPerPage ?? 10,
        total: 0,
    })

    const sortBy = ref<string | undefined>(undefined)
    const sortDirection = ref<'asc' | 'desc' | undefined>(undefined)

    const search = ref<Record<string, string> | undefined>(undefined)

    async function fetchData() {
        loading.value = true

        try {
            const response = await api.get(options.endpoint, {
                params: {
                    page: pagination.value.page,
                    per_page: pagination.value.perPage,
                    order_by: sortBy.value,
                    order_dir: sortDirection.value,
                    search: search.value,
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

        if (
            typeof event.search === 'string' &&
            options.searchableFields?.length
        ) {
            const value = event.search.trim()

            search.value = value
                ? Object.fromEntries(
                    options.searchableFields.map(field => [field, value])
                )
                : undefined
        }

        fetchData()
    }

    return {
        rows,
        loading,
        pagination,
        fetchData,
        handleChange,
    }
}
