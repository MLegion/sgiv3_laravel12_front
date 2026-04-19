export const baseProtectedRoutes = [
    {
        path: '',
        name: 'dashboard',
        component: () => import('@/app/dashboards/DashboardContainer.vue'),
        meta: { title: 'Inicio' }
    },
    {
        path: 'profile',
        name: 'profile',
        component: () => import('@/app/pages/ProfilePage.vue'),
        meta: { title: 'Mi Perfil' }
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
