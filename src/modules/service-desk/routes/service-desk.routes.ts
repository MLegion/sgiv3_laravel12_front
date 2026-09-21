export default [
    {
        path: 'service-desk/emit',
        name: 'service-desk.emit',
        component: () => import('@/modules/service-desk/pages/EmitPage.vue'),
        meta: { title: 'Emitir constancia' },
    },
    {
        path: 'service-desk/emissions',
        name: 'service-desk.emissions',
        component: () => import('@/modules/service-desk/pages/EmissionsPage.vue'),
        meta: { title: 'Emisiones de ventanilla' },
    },
    {
        path: 'service-desk/my-requests',
        name: 'service-desk.my-requests',
        component: () => import('@/modules/service-desk/pages/MyRequestsPage.vue'),
        meta: { title: 'Mis trámites' },
    },
    {
        path: 'service-desk/requests',
        name: 'service-desk.requests',
        component: () => import('@/modules/service-desk/pages/RequestsPage.vue'),
        meta: { title: 'Solicitudes de ventanilla' },
    },
    {
        path: 'service-desk/config',
        name: 'service-desk.config',
        component: () => import('@/modules/service-desk/pages/ConfigPage.vue'),
        meta: { title: 'Configuración de ventanilla' },
    },
]
