import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchMenus } from '@/app/services/menu.service'
import type { MenuItem } from '@/shared/types/menu'
import { useLayoutStore } from '@/app/stores/layout.store'
import { resolveMenuBadges } from '@/app/services/menu-badges'

export const useMenuStore = defineStore('menu', () => {
    // Usamos un ref para mantener la reactividad clara
    const menus = ref<MenuItem[]>([])
    const loaded = ref(false)
    // Conteos por código de item de menú (badges), resueltos por módulo.
    const badges = ref<Record<string, number>>({})
    const layout = useLayoutStore()

    async function loadMenu() {
        if (loaded.value) return

        const response = await fetchMenus()
        menus.value = response.data
        loaded.value = true

        // Carga badges en segundo plano (no bloquea el render del menú).
        loadBadges()
    }

    function collectCodes(items: MenuItem[], acc: Set<string> = new Set()): Set<string> {
        for (const item of items) {
            if (item.code) acc.add(item.code)
            if (item.children) collectCodes(item.children, acc)
        }
        return acc
    }

    /** Refresca los conteos de badge según los items de menú visibles. */
    async function loadBadges() {
        if (!menus.value.length) return
        badges.value = await resolveMenuBadges(collectCodes(menus.value))
    }

    async function reload() {
        loaded.value = false
        menus.value = []
        badges.value = {}
        await loadMenu()
    }

    function clearMenu() {
        menus.value = []
        badges.value = {}
        loaded.value = false
    }

    function handleNavigate() {
        layout.closeMobileSidebar()
    }

    return {
        menus, // Acceder como menuStore.menus
        loaded,
        badges,
        loadMenu,
        loadBadges,
        reload,
        clearMenu,
        handleNavigate
    }
})
