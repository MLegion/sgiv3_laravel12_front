<template>
    <div class="w-full px-2 mb-1">
        <!-- Item principal con comportamiento táctil mejorado -->
        <component
            :is="item.route && !item.children ? 'router-link' : 'div'"
            :to="item.route"
            class="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group select-none relative overflow-hidden active:scale-[0.96]"
            :class="[
                isActive
                    ? 'text-white bg-indigo-600 shadow-md shadow-indigo-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600',
                collapsed ? 'justify-center px-0 w-10 h-10 mx-auto py-0' : ''
            ]"
            @click="handleClick"
            v-bind="collapsed ? { title: item.label } : {}"
        >
            <!-- Indicador lateral activo (Píldora vertical) -->
            <div
                v-if="isActive"
                class="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full transition-all duration-300"
                :class="collapsed ? 'opacity-0' : 'opacity-100'"
            ></div>

            <!-- Contenedor de Icono con escala dinámica -->
            <div class="flex items-center justify-center w-6 h-6 shrink-0 transition-transform duration-300" :class="collapsed ? 'scale-110' : ''">
                <component
                    v-if="Icon"
                    :is="Icon"
                    class="w-5 h-5 transition-colors duration-200"
                    :class="isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'"
                />
            </div>

            <!-- Etiqueta de texto con desvanecimiento -->
            <transition name="fade-text">
                <span
                    v-if="!collapsed"
                    class="flex-1 text-[14px] font-semibold truncate tracking-tight whitespace-nowrap"
                >
                    {{ item.label }}
                </span>
            </transition>

            <!-- Icono de Submenú (Chevron) solo visible si no está colapsado -->
            <div
                v-if="!collapsed && item.children"
                class="transition-transform duration-300 ease-in-out"
                :class="[
                    isActive ? 'text-white' : 'text-slate-300',
                    open ? 'rotate-180' : ''
                ]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                    <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                </svg>
            </div>
        </component>

        <!-- Submenú con indentación y guía visual (Desactivado en colapso) -->
        <transition name="expand">
            <div
                v-if="!collapsed && item.children && open"
                class="mt-1 ml-4 space-y-1 border-l-2 border-slate-100 pl-2 overflow-hidden"
            >
                <SidebarItem
                    v-for="child in item.children"
                    :key="child.path"
                    :item="child"
                    :collapsed="false"
                />
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore } from '@/app/stores/menu.store'
import * as HeroIcons from '@heroicons/vue/24/outline'

const props = defineProps<{
    item: any
    collapsed: boolean
}>()

const route = useRoute()
const menuStore = useMenuStore()
const open = ref(false)

const iconMap: any = HeroIcons
const Icon = computed(() =>
    props.item.icon ? iconMap[props.item.icon] : null
)

const isActive = computed(() => {
    if (props.item.route) return route.path === props.item.route
    if (props.item.children) {
        return props.item.children.some((child: any) => {
            if (route.path === child.route) return true
            if (child.children) {
                return child.children.some((subChild: any) => route.path === subChild.route)
            }
            return false
        })
    }
    return false
})

function handleClick() {
    if (props.item.children && !props.collapsed) {
        open.value = !open.value
    }

    // Cierre automático del menú móvil al navegar
    if (props.item.route && (!props.item.children || props.item.children.length === 0)) {
        if (typeof menuStore.handleNavigate === 'function') {
            menuStore.handleNavigate()
        }
    }
}

const syncExpansion = () => {
    if (props.item.children && !props.collapsed) {
        const hasActiveChild = props.item.children.some((child: any) => {
            if (route.path === child.route) return true
            if (child.children) {
                return child.children.some((subChild: any) => route.path === subChild.route)
            }
            return false
        })
        if (hasActiveChild) open.value = true
    }
}

onMounted(syncExpansion)
watch(() => route.path, syncExpansion)

// Si el sidebar se colapsa, cerramos los submenús abiertos por limpieza
watch(
    () => props.collapsed,
    (isCollapsed) => {
        if (isCollapsed) open.value = false
        else syncExpansion()
    }
)
</script>

<style scoped>
/* Eliminar el molesto recuadro azul en móviles */
* {
    -webkit-tap-highlight-color: transparent;
}

/* Transición para el texto del menú */
.fade-text-enter-active, .fade-text-leave-active {
    transition: opacity 0.2s ease;
}
.fade-text-enter-from, .fade-text-leave-to {
    opacity: 0;
}

/* Animación de expansión de submenú */
.expand-enter-active, .expand-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-height: 500px;
}
.expand-enter-from, .expand-leave-to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-5px);
}
</style>
