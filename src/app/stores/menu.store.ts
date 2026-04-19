import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchMenus } from '@/app/services/menu.service'
import type { MenuItem } from '@/shared/types/menu'
import { useLayoutStore } from '@/app/stores/layout.store'

export const useMenuStore = defineStore('menu', () => {
    // Usamos un ref para mantener la reactividad clara
    const menus = ref<MenuItem[]>([])
    const loaded = ref(false)
    const layout = useLayoutStore()

    async function loadMenu() {
        if (loaded.value) return

        const response = await fetchMenus()
        menus.value = response.data
        loaded.value = true
    }

    async function reload() {
        loaded.value = false
        menus.value = []
        await loadMenu()
    }

    function clearMenu() {
        menus.value = []
        loaded.value = false
    }

    function handleNavigate() {
        layout.closeMobileSidebar()
    }

    return {
        menus, // Acceder como menuStore.menus
        loaded,
        loadMenu,
        reload,
        clearMenu,
        handleNavigate
    }
})
