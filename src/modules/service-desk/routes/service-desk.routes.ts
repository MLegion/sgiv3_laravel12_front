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
]
