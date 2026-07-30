<template>
    <div class="w-full mb-0.5" :class="depth > 0 ? 'px-0.5' : 'px-2'">

        <!-- ── Etiqueta de sección (grupo de nivel 2+ con children) ── -->
        <div
            v-if="depth > 0 && item.children && !collapsed"
            class="flex items-center gap-2 px-2 pt-2.5 pb-0.5 cursor-pointer select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
            :title="item.label"
            role="button"
            tabindex="0"
            :aria-expanded="open"
            @click="handleClick"
            @keydown="onKeydown"
        >
            <component
                v-if="Icon"
                :is="Icon"
                class="w-3.5 h-3.5 shrink-0 transition-colors duration-200 brand-hover-color"
                :class="open ? 'is-branded' : 'text-slate-300'"
            />
            <span
                class="flex-1 text-[10px] font-black uppercase tracking-widest truncate transition-colors duration-200 brand-hover-color"
                :class="open ? 'is-branded' : 'text-slate-400'"
            >
                {{ item.label }}
            </span>
            <span
                v-if="displayBadge > 0"
                class="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none bg-amber-100 text-amber-700"
            >{{ badgeText }}</span>
            <svg
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                class="w-3 h-3 transition-transform duration-300 shrink-0 brand-hover-color"
                :class="[open ? 'rotate-180 is-branded' : 'text-slate-300']"
            >
                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
        </div>

        <!-- ── Item normal (leaf o nivel 0 con children) ── -->
        <component
            v-else
            :is="item.route && !item.children ? 'router-link' : 'div'"
            :to="item.route"
            class="flex items-center gap-2 rounded-xl cursor-pointer transition-all duration-300 group select-none relative overflow-hidden active:scale-[0.96] sidebar-item focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            :class="[
                isActive
                    ? 'is-active text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100',
                collapsed ? 'justify-center px-0 w-10 h-10 mx-auto py-0' : '',
                depth > 0 ? 'px-3 py-1.5' : 'px-4 py-2.5'
            ]"
            :role="isLeafLink ? undefined : 'button'"
            :tabindex="isLeafLink ? undefined : 0"
            :aria-expanded="item.children ? open : undefined"
            @click="handleClick"
            @keydown="isLeafLink ? undefined : onKeydown($event)"
            :title="item.label"
        >
            <!-- Indicador lateral activo -->
            <div
                v-if="isActive"
                class="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full transition-all duration-300"
                :class="collapsed ? 'opacity-0' : 'opacity-100'"
            ></div>

            <!-- Icono -->
            <div class="relative flex items-center justify-center w-6 h-6 shrink-0 transition-transform duration-300" :class="collapsed ? 'scale-110' : ''">
                <component
                    v-if="Icon"
                    :is="Icon"
                    class="transition-colors duration-200 group-hover-brand"
                    :class="[
                        isActive ? 'text-white' : 'text-slate-400',
                        depth > 0 ? 'w-4 h-4' : 'w-5 h-5'
                    ]"
                />
                <!-- Punto indicador cuando el sidebar está colapsado -->
                <span
                    v-if="collapsed && displayBadge > 0"
                    class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"
                ></span>
            </div>

            <!-- Etiqueta -->
            <transition name="fade-text">
                <span
                    v-if="!collapsed"
                    class="flex-1 tracking-tight leading-tight uppercase"
                    :class="depth > 0 ? 'text-[12px] font-medium' : 'text-[13px] font-semibold'"
                >
                    {{ item.label }}
                </span>
            </transition>

            <!-- Badge de conteo (no colapsado) -->
            <span
                v-if="!collapsed && displayBadge > 0"
                class="ml-auto shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none"
                :class="isActive ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'"
            >{{ badgeText }}</span>

            <!-- Chevron (solo nivel 0 con children) -->
            <div
                v-if="!collapsed && item.children && depth === 0"
                class="transition-transform duration-300 ease-in-out"
                :class="[isActive ? 'text-white' : 'text-slate-300', open ? 'rotate-180' : '']"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                    <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                </svg>
            </div>
        </component>

        <!-- Submenú -->
        <transition name="expand">
            <div
                v-if="!collapsed && item.children && open"
                class="overflow-hidden"
                :class="depth === 0 ? 'mt-1 ml-2 space-y-0.5 border-l-2 pl-1 submenu-border' : 'mt-0.5 ml-1 space-y-0.5'"
            >
                <SidebarItem
                    v-for="child in item.children"
                    :key="child.code"
                    :item="child"
                    :collapsed="false"
                    :depth="depth + 1"
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

const props = withDefaults(defineProps<{
    item: any
    collapsed: boolean
    depth?: number
}>(), {
    depth: 0
})

const route = useRoute()
const menuStore = useMenuStore()
const open = ref(false)

const iconMap: any = HeroIcons
const Icon = computed(() =>
    props.item.icon ? iconMap[props.item.icon] : null
)

/** Item hoja con ruta: es un <router-link> (ya operable por teclado nativamente). */
const isLeafLink = computed(() => !!props.item.route && !props.item.children)

/** Suma el badge propio + el de todos los descendientes (roll-up). */
function sumBadges(item: any): number {
    let total = menuStore.badges?.[item.code] ?? 0
    if (item.children) {
        for (const child of item.children) total += sumBadges(child)
    }
    return total
}

/**
 * Badge a mostrar: en un padre se hace roll-up de los descendientes mientras
 * el submenú esté cerrado o el sidebar colapsado; al abrirlo, el conteo se ve
 * directamente en los hijos.
 */
const displayBadge = computed(() => {
    const n = props.item.children ? sumBadges(props.item) : (menuStore.badges?.[props.item.code] ?? 0)
    if (n <= 0) return 0
    if (props.item.children && open.value && !props.collapsed) return 0
    return n
})
const badgeText = computed(() => String(displayBadge.value))

/** Solo las hojas (items con ruta y sin children) se marcan como activos */
const isActive = computed(() => {
    if (props.item.route && !props.item.children) return route.path === props.item.route
    return false
})

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        handleClick()
    }
}

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

/* ─────────────────────────────────────────────────────────────
 * Estilos brandeables: usan var(--brand-primary) con fallback
 * a indigo-600 cuando el colegio no tiene tema configurado.
 * ───────────────────────────────────────────────────────────── */
.sidebar-item.is-active {
    background-color: var(--brand-primary, #4f46e5);
}
.sidebar-item:not(.is-active):hover {
    color: var(--brand-primary, #4f46e5);
}
.sidebar-item:not(.is-active):hover .group-hover-brand {
    color: var(--brand-primary, #4f46e5);
}
.is-branded {
    color: var(--brand-primary, #4f46e5);
}
.brand-hover-color {
    transition: color 0.2s ease;
}
.group:hover .brand-hover-color {
    color: var(--brand-primary, #4f46e5);
}
.submenu-border {
    border-color: color-mix(in srgb, var(--brand-primary, #4f46e5) 20%, transparent);
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
