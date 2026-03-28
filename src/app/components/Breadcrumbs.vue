<template>
    <nav class="flex mb-6" aria-label="Breadcrumb">
        <ol class="flex items-center space-x-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-sm">
            <!-- Botón Inicio -->
            <li class="flex items-center">
                <router-link
                    to="/"
                    class="p-2 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-lg block transition-all"
                >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
                        />
                    </svg>
                </router-link>
            </li>

            <!-- Pasos Dinámicos -->
            <li
                v-for="(crumb, index) in breadcrumbs"
                :key="index"
                class="flex items-center"
            >
                <svg class="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clip-rule="evenodd"
                    />
                </svg>

                <!-- Navegable -->
                <router-link
                    v-if="crumb.path"
                    :to="crumb.path"
                    class="px-3 py-1 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
                >
                    {{ crumb.title }}
                </router-link>

                <!-- Actual / sin ruta -->
                <span
                    v-else
                    class="px-3 py-1 text-xs font-bold bg-white text-blue-600 shadow-sm border border-blue-100 rounded-lg"
                >
                    {{ crumb.title }}
                </span>
            </li>
        </ol>
    </nav>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore } from '@/app/stores/menu.store'

interface Crumb {
    title: string
    path?: string
}

const route = useRoute()
const menuStore = useMenuStore()

/**
 * Busca recursivamente un item del menú por su route (URL path).
 * Devuelve { trail, exact } donde exact indica si fue match exacto
 * (página de lista) o de prefijo (sub-página: show/edit/delete).
 */
function findMenuTrail(
    items: any[],
    currentPath: string,
    parents: any[] = []
): { trail: any[]; exact: boolean } | null {
    for (const item of items) {
        const trail = [...parents, item]

        if (item.route) {
            if (item.route === currentPath) {
                return { trail, exact: true }
            }
            if (currentPath.startsWith(item.route + '/')) {
                return { trail, exact: false }
            }
        }

        if (item.children?.length) {
            const found = findMenuTrail(item.children, currentPath, trail)
            if (found) return found
        }
    }
    return null
}

const breadcrumbs = computed<Crumb[]>(() => {
    if (!route.path || !menuStore.menus.length) return []

    const result = findMenuTrail(menuStore.menus, route.path)

    // Sin match: mostrar solo el título de la ruta actual
    if (!result) {
        return route.meta?.title ? [{ title: route.meta.title as string }] : []
    }

    const { trail, exact } = result

    const crumbs: Crumb[] = trail.map((item, index) => ({
        title: item.label,
        path: index < trail.length - 1 && item.route ? item.route : undefined,
    }))

    // Sub-página (show/edit/delete): agregar el título actual al final
    if (!exact && route.meta?.title) {
        crumbs.push({ title: route.meta.title as string })
    }

    return crumbs
})
</script>

