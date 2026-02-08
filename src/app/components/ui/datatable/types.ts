/**
 * Tipos base para el DataTable genérico de SGI v3
 * -----------------------------------------------
 * - Sin lógica de negocio
 * - Reutilizable
 * - Server-side friendly
 * - Preparado para exportación
 */

/**
 * Tipos de exportación soportados
 */
export type DataTableExportType = 'csv' | 'xlsx' | 'pdf'

/**
 * Definición de una columna del DataTable
 */
export interface DataTableColumn<T = any> {
    /**
     * Clave única de la columna
     * (normalmente coincide con la propiedad del row)
     */
    key: string

    /**
     * Título visible en el header
     */
    label: string

    /**
     * Campo del row que representa la columna
     * Puede omitirse si se usa slot o formatter
     */
    field?: keyof T | string

    /**
     * Indica si la columna es ordenable
     */
    sortable?: boolean

    /**
     * Ancho opcional (px, %, rem, etc.)
     */
    width?: string

    /**
     * Alineación del contenido
     */
    align?: 'left' | 'center' | 'right'

    /**
     * Función para formatear el valor (display)
     */
    formatter?: (value: any, row: T) => string

    /**
     * Indica si esta columna participa en exportación
     * (por defecto true)
     */
    exportable?: boolean
}

/**
 * Estado de paginación (server-side)
 */
export interface DataTablePagination {
    /**
     * Página actual (1-based)
     */
    page: number

    /**
     * Registros por página
     */
    perPage: number

    /**
     * Total de registros (backend)
     */
    total: number
}

/**
 * Payload emitido cuando el DataTable cambia
 * (paginación, orden, búsqueda)
 */
export interface DataTableChangeEvent {
    page: number
    perPage: number
    sortBy?: string
    sortDirection?: 'asc' | 'desc'
    search?: string | Record<string, string>
}

/**
 * Evento de exportación
 */
export interface DataTableExportEvent<T = any> {
    type: DataTableExportType
    rows: T[]
    columns: DataTableColumn<T>[]
}

/**
 * Props públicas del DataTable
 */
export interface DataTableProps<T = any> {
    /**
     * Columnas de la tabla
     */
    columns: DataTableColumn<T>[]

    /**
     * Filas visibles (solo la página actual)
     */
    rows: T[]

    perPageOptions?: number[]

    sortBy?: string

    sortDirection?: 'asc' | 'desc'

    /**
     * Estado de carga
     */
    loading?: boolean

    /**
     * Paginación server-side
     */
    pagination?: DataTablePagination

    /**
     * Tipos de exportación habilitados
     */
    exportable?: DataTableExportType[]

    /**
     * Texto cuando no hay registros
     */
    emptyText?: string

    searchPlaceholder?: string
}

/**
 * Eventos emitidos por el DataTable
 */
export interface DataTableEmits<T = any> {
    /**
     * Cambio de estado (paginación / orden / búsqueda)
     */
    (e: 'change', payload: DataTableChangeEvent): void

    /**
     * Exportación solicitada
     */
    (e: 'export', payload: DataTableExportEvent<T>): void
}
