import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchMenus } from '@/app/services/menu.service'
import type { MenuItem } from '@/shared/types/menu'

export const useMenuStore = defineStore('menu', () => {
    // Usamos un ref para mantener la reactividad clara
    const menus = ref<MenuItem[]>([])
    const loaded = ref(false)

    async function loadMenu() {
        if (loaded.value) return

        const response = await fetchMenus()
        menus.value = response.data
        loaded.value = true
    }

    function clearMenu() {
        menus.value = []
    }

    return {
        menus, // Acceder como menuStore.menus
        loaded,
        loadMenu,
        clearMenu
    }
})
