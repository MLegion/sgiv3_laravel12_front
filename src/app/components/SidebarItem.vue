<template>
    <div>
        <!-- Item principal -->
        <component
            :is="item.route && !item.children ? 'router-link' : 'div'"
            :to="item.route"
            class="flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-all group select-none"
            :class="[
                isActive ? 'text-white bg-blue-600 shadow-lg' : 'hover:bg-blue-200 hover:text-blue-900',
                collapsed ? 'justify-center' : ''
            ]"
            @click="handleClick"
            :title="collapsed ? item.label : undefined"
        >
            <!-- Icono -->
            <component
                v-if="Icon"
                :is="Icon"
                class="w-5 h-5 shrink-0 transition-colors"
                :class="isActive ? 'text-white' : 'group-hover:text-blue-800'"
            />

            <!-- Label -->
            <span
                v-if="!collapsed"
                class="flex-1 text-sm font-medium truncate"
            >
                {{ item.label }}
            </span>

            <!-- Indicador de Submenú (Flecha) -->
            <span
                v-if="!collapsed && item.children"
                class="text-[10px] transition-transform duration-200"
                :class="[
                    isActive ? 'text-white' : 'text-slate-500',
                    { 'rotate-90': open }
                ]"
            >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </span>
        </component>

        <!-- Submenú Recursivo -->
        <div
            v-if="open && item.children && !collapsed"
            class="ml-4 mt-1 border-l border-slate-700 pl-2 space-y-1 transition-all"
        >
            <SidebarItem
                v-for="child in item.children"
                :key="child.label"
                :item="child"
                :collapsed="collapsed"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { MenuItem } from '@/shared/types/menu'
import { iconMap } from '@/shared/icons'

const props = defineProps<{
    item: MenuItem
    collapsed?: boolean
}>()

const route = useRoute()
const open = ref(false)

/**
 * Determina si el ítem actual está activo basándose en la ruta.
 * También se marca como activo si uno de sus hijos está activo.
 */
const isActive = computed(() => {
    if (props.item.route && route.path === props.item.route) return true
    if (props.item.children) {
        return props.item.children.some(child => route.path === child.route)
    }
    return false
})

/**
 * Resuelve el icono desde el mapa de iconos
 */
const Icon = computed(() =>
    props.item.icon ? iconMap[props.item.icon] : null
)

/**
 * Mantiene el submenú abierto si la ruta actual coincide con un hijo.
 * Esto evita que el menú se colapse al navegar.
 */
const syncExpansion = () => {
    if (props.item.children && !props.collapsed) {
        const hasActiveChild = props.item.children.some(child => {
            // Verifica si el hijo es la ruta actual
            if (route.path === child.route) return true
            // Si el hijo tiene sus propios hijos, verificar recursivamente
            if (child.children) {
                return child.children.some(subChild => route.path === subChild.route)
            }
            return false
        })

        if (hasActiveChild) {
            open.value = true
        }
    }
}

// Sincronizar al montar el componente y cada vez que cambie la ruta
onMounted(syncExpansion)
watch(() => route.path, syncExpansion)

/**
 * Maneja el clic en el ítem
 */
function handleClick() {
    if (props.item.children && !props.collapsed) {
        open.value = !open.value
    }
}

/**
 * Cerrar submenús si se colapsa el sidebar globalmente
 */
watch(
    () => props.collapsed,
    (isCollapsed) => {
        if (isCollapsed) {
            open.value = false
        } else {
            syncExpansion()
        }
    }
)
</script>

<style scoped>
/* Eliminar estilos por defecto de los enlaces */
a {
    text-decoration: none;
    color: inherit;
}
</style>
