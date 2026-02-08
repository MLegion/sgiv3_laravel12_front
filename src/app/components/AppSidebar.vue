<template>
    <aside
        class="bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col z-50 shadow-sm overflow-hidden h-full"
        :class="[
            isExpanded ? 'w-64' : 'w-20'
        ]"
        @mouseenter="layout.setHovered(true)"
        @mouseleave="layout.setHovered(false)"
    >
        <!-- Header Minimalista -->
        <div class="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-slate-50">
            <transition name="fade">
                <span v-if="isExpanded" class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2">
                    Navegación
                </span>
            </transition>

            <button
                class="transition-all duration-200 p-2 rounded-xl group items-center justify-center"
                :class="[
                    layout.sidebarPinned
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-300 hover:bg-slate-50 hover:text-slate-600',
                    // Ocultar botón de pin en móviles ya que suele estar siempre expandido o controlado por un drawer externo
                    'hidden md:flex'
                ]"
                @click="layout.togglePin"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="w-4 h-4 transition-transform duration-300"
                    :class="layout.sidebarPinned ? 'rotate-0' : '-rotate-45 opacity-40'"
                >
                    <path fill-rule="evenodd" d="M12 1.5a.75.75 0 0 1 .75.75V7.5h-1.5V2.25A.75.75 0 0 1 12 1.5ZM11.25 7.5v5.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V7.5h3.75a.75.75 0 0 1 0 1.5h-.75v9a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75v-9h-.75a.75.75 0 0 1 0-1.5h3.75Z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>

        <!-- Navegación Central -->
        <nav class="flex-1 overflow-y-auto py-4 custom-scrollbar bg-gradient-to-b from-white via-white to-slate-50/30">
            <div :class="['space-y-1', isExpanded ? 'px-3' : 'px-2']">
                <template v-for="item in menuList" :key="item.path">
                    <SidebarItem
                        :item="item"
                        :collapsed="!isExpanded"
                    />
                </template>
            </div>
        </nav>

        <!-- Footer: Acción de Salida -->
        <div class="flex flex-col border-t border-slate-50 p-2">
            <button
                @click="handleLogout"
                class="w-full flex items-center gap-3 py-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                :class="isExpanded ? 'px-4' : 'justify-center'"
                title="Cerrar Sesión"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 group-hover:-translate-x-1 transition-transform">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
                <span v-if="isExpanded" class="text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                    Salir del Sistema
                </span>
            </button>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useMenuStore } from '@/app/stores/menu.store'
import { useLayoutStore } from '@/app/stores/layout.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import SidebarItem from '@/app/components/SidebarItem.vue'

const menuStore = useMenuStore()
const layout = useLayoutStore()
const authStore = useAuthStore()

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)

const updateWidth = () => {
    windowWidth.value = window.innerWidth
}

onMounted(() => {
    window.addEventListener('resize', updateWidth)
})

onUnmounted(() => {
    window.removeEventListener('resize', updateWidth)
})

const menuList = computed(() => {
    return Array.isArray(menuStore.menus) ? menuStore.menus : []
})

/**
 * Lógica de expansión mejorada:
 * 1. Si la pantalla es menor a 1024px (Tablets/Móviles), forzamos expansión para evitar modo compacto ilegible.
 * 2. En desktop, respetamos el estado del store (pinned o hovered).
 */
const isExpanded = computed(() => {
    if (windowWidth.value < 1024) return true
    return layout.isSidebarExpanded
})

const handleLogout = () => {
    authStore.logout()
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 3px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #f1f5f9;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #e2e8f0;
}

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

aside {
    -webkit-tap-highlight-color: transparent;
}
</style>
