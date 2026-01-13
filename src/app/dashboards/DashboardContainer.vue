<template>
    <component :is="activeDashboard" v-if="activeDashboard" />
    <div v-else class="flex justify-center p-10">
        <span class="i-heroicons-arrow-path animate-spin text-3xl text-slate-400" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { resolveDashboard } from '@/app/dashboards/DashboardResolver'

const auth = useAuthStore()
const activeDashboard = shallowRef(null)

onMounted(async () => {
    // 1. Obtenemos el tipo desde la entidad user (ej. 'admin', 'seller')
    // Si el backend no envía nada, resolveDashboard usará 'default'
    const dashboardType = auth.user?.dashboard || 'default'

    // 2. Usamos tu lógica de autodescubrimiento para traer el componente
    activeDashboard.value = await resolveDashboard(dashboardType)
})
</script>
