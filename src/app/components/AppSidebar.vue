<template>
    <aside
        class="transition-all duration-300 flex flex-col z-50 shadow-xl overflow-hidden h-full"
        :class="isExpanded ? 'w-64' : 'w-16'"
        @mouseenter="layout.setHovered(true)"
        @mouseleave="layout.setHovered(false)"
    >
        <!-- Header del Sidebar -->
        <div class="h-16 flex-shrink-0 flex items-center justify-between px-4 border-b">
            <button
                class="text-slate-400 transition p-1 rounded-md hover:bg-slate-800"
                @click="layout.togglePin"
                title="Fijar menú"
            >
                <span
                    class="text-lg block"
                    :class="layout.sidebarPinned ? 'i-heroicons-pin-solid' : 'i-heroicons-pin'"
                />
                PIN
            </button>
        </div>

        <!-- Navegación de Módulos (Scrollable) -->
        <nav class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <template v-for="item in menuList" :key="item.path">
                <SidebarItem
                    :item="item"
                    :collapsed="!isExpanded"
                />
            </template>
        </nav>

        <!-- Sección Inferior: Cerrar Sesión (Siempre visible al final) -->
        <div class="flex-shrink-0 border-t border-slate-800 p-2">
            <button
                @click="handleLogout"
                class="flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-blue-200 transition-all w-full group overflow-hidden"
                title="Cerrar sesión"
            >
                <!-- Icono de salida forzado: Usamos puerta abierta si está disponible -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
                </svg>

                <span
                    v-if="isExpanded"
                    class="font-medium whitespace-nowrap transition-opacity duration-300"
                >
                    Cerrar sesión
                </span>
            </button>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMenuStore } from '@/app/stores/menu.store'
import { useLayoutStore } from '@/app/stores/layout.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import SidebarItem from '@/app/components/SidebarItem.vue'

const menuStore = useMenuStore()
const layout = useLayoutStore()
const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {})

const menuList = computed(() => {
    return Array.isArray(menuStore.menus) ? menuStore.menus : []
})

const isExpanded = computed(() => layout.isSidebarExpanded)

/**
 * Ejecuta el cierre de sesión y redirige al login
 */
const handleLogout = async () => {
    authStore.logout()
}
</script>

<style scoped>
/* Estilización de la barra de desplazamiento interna */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #475569;
}
</style>
