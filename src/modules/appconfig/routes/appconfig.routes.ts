export default [
    {
        path: 'appconfig',
        name: 'appconfig.list',
        component: () => import('@/modules/appconfig/pages/AppConfigsPage.vue'),
        meta: { title: 'Configuración del College' },
    },
    {
        path: 'appconfig/:appId',
        name: 'appconfig.edit',
        component: () => import('@/modules/appconfig/pages/AppConfigEditPage.vue'),
        meta: { title: 'Editar Configuración' },
    },
]
