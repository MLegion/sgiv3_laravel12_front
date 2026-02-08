<template>
    <div class="h-screen flex flex-col bg-slate-50 overflow-hidden text-slate-900">

        <!-- Navbar Superior: Ahora incluye el botón de menú móvil -->
        <AppNavbar @toggle-sidebar="layout.toggleMobileSidebar()" />

        <div class="flex flex-1 overflow-hidden relative">

            <!-- Overlay para móvil: Cierra el sidebar al hacer clic fuera -->
            <Transition
                enter-active-class="transition-opacity ease-linear duration-300"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition-opacity ease-linear duration-300"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div
                    v-if="layout.isMobileSidebarOpen"
                    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
                    @click="layout.closeMobileSidebar"
                ></div>
            </Transition>

            <!-- Sidebar: Adaptado para ser Drawer en móvil y Colapsable en Desktop -->
            <AppSidebar
                :class="[
          'fixed inset-y-0 left-0 z-[70] lg:relative lg:z-0 transform transition-transform duration-300 ease-in-out',
          layout.isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        ]"
            />

            <!-- Contenido Principal -->
            <main class="flex-1 flex flex-col min-w-0 overflow-hidden">

                <!-- Área de Scroll del Contenido -->
                <div class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">

                    <!-- Contenedor con padding responsivo -->
                    <div class="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto w-full">

                        <!-- Breadcrumbs dinámicos -->
                        <div class="mb-6">
                            <Breadcrumbs />
                        </div>

                        <!-- Vista de Ruta con transición -->
                        <router-view v-slot="{ Component }">
                            <transition name="page" mode="out-in">
                                <component :is="Component" />
                            </transition>
                        </router-view>

                    </div>
                </div>

            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import AppNavbar from '@/app/components/AppNavbar.vue';
import AppSidebar from '@/app/components/AppSidebar.vue';
import Breadcrumbs from '@/app/components/Breadcrumbs.vue';
import { useLayoutStore } from '@/app/stores/layout.store';

const layout = useLayoutStore();

// Cerrar sidebar móvil si se redimensiona a pantalla grande
const handleResize = () => {
    if (window.innerWidth >= 1024 && layout.isMobileSidebarOpen) {
        layout.closeMobileSidebar();
    }
};

onMounted(() => {
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* Transición de páginas suave */
.page-enter-active,
.page-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
    opacity: 0;
    transform: translateY(5px);
}

.page-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}

/* Scrollbar estética */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
}
</style>
