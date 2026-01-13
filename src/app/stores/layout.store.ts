import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', {
    state: () => ({
        sidebarPinned: localStorage.getItem('sidebarPinned') === 'true',
        sidebarHovered: false,
    }),

    getters: {
        isSidebarExpanded(state): boolean {
            return state.sidebarPinned || state.sidebarHovered
        },
    },

    actions: {
        togglePin() {
            this.sidebarPinned = !this.sidebarPinned
            localStorage.setItem('sidebarPinned', String(this.sidebarPinned))
        },

        setHovered(value: boolean) {
            this.sidebarHovered = value
        },
    },
})
