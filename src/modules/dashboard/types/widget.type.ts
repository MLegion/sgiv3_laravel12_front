export type WidgetSize = 'sm' | 'md' | 'lg'
export type WidgetRefresh = 'static' | 'live'

/**
 * Metadata de un widget tal como la entrega el backend (`/dashboard/widgets`).
 * Permissions y context ya fueron filtrados server-side; el frontend solo
 * monta y consume.
 */
export interface WidgetMeta {
    id: string
    title: string
    description?: string
    image?: string
    component: string
    size: WidgetSize
    order?: number
    refresh: WidgetRefresh
    poll_seconds?: number
    ws_channel?: string
    ws_event?: string
    data_url?: string
}

/**
 * Item del catálogo (`/dashboard/widgets/catalog`): es un WidgetMeta más el
 * flag `active` que indica si el user ya lo tiene agregado a su dashboard.
 */
export interface WidgetCatalogItem extends WidgetMeta {
    active: boolean
}
