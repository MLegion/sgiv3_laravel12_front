<template>
    <div class="dashboard-container p-6">
        <header class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800">Panel de Control SGIv3</h1>
            <p class="text-gray-600">Bienvenido al Sistema de Gestión Integral</p>
        </header>

        <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div class="card bg-blue-500 text-white p-4 rounded-lg shadow">
                <h3>Actividad Global</h3>
                <p class="text-2xl font-bold">85%</p>
            </div>
        </section>

        <h2 class="text-xl font-semibold mb-4 text-gray-700">Módulos del Sistema</h2>
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
                v-for="route in moduleRoutes"
                :key="route.name"
                @click="navigateTo(route.name)"
                class="cursor-pointer hover:shadow-lg transition-all border p-4 rounded-xl bg-white flex items-center gap-4"
            >
                <div class="icon-box p-3 bg-gray-100 rounded-lg text-2xl">
                    {{ route.meta?.icon || '📦' }}
                </div>
                <div>
                    <h3 class="font-bold capitalize">{{ route.name }}</h3>
                    <p class="text-xs text-gray-500">Acceder al módulo</p>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()

/**
 * Filtramos las rutas para mostrar solo aquellas que pertenecen a módulos
 * y que no son el dashboard mismo.
 */
const moduleRoutes = computed(() => {
    return router.getRoutes().filter(route =>
        route.meta?.requiresAuth &&
        route.name !== 'dashboard' &&
        !route.path.includes(':') // Excluir rutas con parámetros si se desea
    )
})

const navigateTo = (routeName: string | symbol | undefined) => {
    if (routeName) router.push({ name: routeName })
}
</script>
