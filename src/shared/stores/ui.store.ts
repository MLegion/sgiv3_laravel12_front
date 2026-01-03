import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
    state: () => ({
        sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
        sidebarOpenMobile: false,
    }),

    actions: {
        toggleSidebar() {
            this.sidebarCollapsed = !this.sidebarCollapsed
            localStorage.setItem('sidebarCollapsed', String(this.sidebarCollapsed))
        },
        openMobileSidebar() {
            this.sidebarOpenMobile = true
        },
        closeMobileSidebar() {
            this.sidebarOpenMobile = false
        },
    },
})
