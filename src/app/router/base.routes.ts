export const baseProtectedRoutes = [
    {
        path: '',
        name: 'dashboard',
        // Apuntamos al contenedor que usa tu Resolver lógico
        component: () => import('@/app/dashboards/DashboardContainer.vue'),
        meta: { title: 'Inicio' }
    },
]

export const basePublicRoutes = [
    {
        path: '/maintenance',
        name: 'maintenance',
        component: () => import('@/app/pages/MaintenancePage.vue'),
        meta: { title: 'Mantenimiento' }
    },
    {
        path: '/error',
        name: 'server-error',
        component: () => import('@/app/pages/ServerErrorPage.vue'),
        meta: { title: 'Error de Servidor' }
    },
]
