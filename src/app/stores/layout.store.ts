import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', {
    state: () => ({
        // Control de escritorio (Hover/Pin)
        sidebarPinned: localStorage.getItem('sidebarPinned') === 'true',
        sidebarHovered: false,

        // Control de móviles (Drawer)
        isMobileSidebarOpen: false,
    }),

    getters: {
        /**
         * Determina si el sidebar debe mostrarse expandido (escritorio).
         */
        isSidebarExpanded(state): boolean {
            return state.sidebarPinned || state.sidebarHovered
        },
    },

    actions: {
        /**
         * Alterna el estado de fijado en escritorio.
         */
        togglePin() {
            this.sidebarPinned = !this.sidebarPinned
            localStorage.setItem('sidebarPinned', String(this.sidebarPinned))
        },

        /**
         * Controla el efecto hover en escritorio.
         */
        setHovered(value: boolean) {
            this.sidebarHovered = value
        },

        /**
         * Abre o cierra el sidebar en modo móvil.
         */
        toggleMobileSidebar() {
            this.isMobileSidebarOpen = !this.isMobileSidebarOpen
        },

        /**
         * Asegura el cierre del sidebar (útil al navegar).
         */
        closeMobileSidebar() {
            this.isMobileSidebarOpen = false
        }
    },
})
