<template>
    <component :is="activeDashboard" v-if="activeDashboard" />
    <div v-else class="flex justify-center p-10">
        <span class="i-heroicons-arrow-path animate-spin text-3xl text-slate-400" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, shallowRef, type Component } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useMenuStore } from '@/app/stores/menu.store'
import { resolveDashboard } from '@/app/dashboards/DashboardResolver'
import type { MenuItem } from '@/shared/types/menu'

const auth = useAuthStore()
const menu = useMenuStore()
const activeDashboard = shallowRef<Component | null>(null)

/** El aspirante (rol APPLICANT) es el único con el menú del portal 'adm.portal'. */
function isApplicant(items: MenuItem[]): boolean {
    return items.some(i => i.code === 'adm.portal' || (!!i.children && isApplicant(i.children)))
}

onMounted(async () => {
    // El aspirante recibe su Inicio dedicado; el resto, el tipo del backend
    // (o 'default' = tablero de widgets).
    const dashboardType = isApplicant(menu.menus ?? [])
        ? 'applicant'
        : (auth.user?.dashboard || 'default')

    activeDashboard.value = await resolveDashboard(dashboardType)
})
</script>
