import { defineStore } from 'pinia'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { WidgetCatalogItem, WidgetMeta } from '@/modules/dashboard/types/widget.type'

interface State {
    active:         WidgetMeta[]
    catalog:        WidgetCatalogItem[]
    loadingActive:  boolean
    loadingCatalog: boolean
    mutating:       boolean
}

/**
 * Estado del dashboard del user actual: widgets activos (los que muestra
 * la página) y catálogo (los que el modal le permite agregar). Mantiene
 * ambos en sync — al agregar/quitar, el backend devuelve la lista activa
 * fresca y actualizamos el flag `active` del catálogo en paralelo.
 */
export const useDashboardStore = defineStore('dashboard', {
    state: (): State => ({
        active:         [],
        catalog:        [],
        loadingActive:  false,
        loadingCatalog: false,
        mutating:       false,
    }),

    actions: {
        async loadActive(): Promise<void> {
            this.loadingActive = true
            try {
                const { data } = await api.get<WidgetMeta[]>(API.DASHBOARD_API.widgets.list)
                this.active = Array.isArray(data) ? data : []
            } finally {
                this.loadingActive = false
            }
        },

        async loadCatalog(): Promise<void> {
            this.loadingCatalog = true
            try {
                const { data } = await api.get<WidgetCatalogItem[]>(API.DASHBOARD_API.widgets.catalog)
                this.catalog = Array.isArray(data) ? data : []
            } finally {
                this.loadingCatalog = false
            }
        },

        async add(id: string): Promise<void> {
            this.mutating = true
            try {
                const { data } = await api.post<WidgetMeta[]>(API.DASHBOARD_API.widgets.add(id))
                this.active = Array.isArray(data) ? data : []
                this.markCatalog(id, true)
            } finally {
                this.mutating = false
            }
        },

        async remove(id: string): Promise<void> {
            this.mutating = true
            try {
                const { data } = await api.delete<WidgetMeta[]>(API.DASHBOARD_API.widgets.remove(id))
                this.active = Array.isArray(data) ? data : []
                this.markCatalog(id, false)
            } finally {
                this.mutating = false
            }
        },

        markCatalog(id: string, active: boolean): void {
            const item = this.catalog.find(c => c.id === id)
            if (item) item.active = active
        },
    },
})
