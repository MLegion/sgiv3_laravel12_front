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
        path: 'service-desk/request',
        name: 'service-desk.request',
        component: () => import('@/modules/service-desk/pages/RequestDocumentPage.vue'),
        meta: { title: 'Solicitar documento' },
    },
    {
        path: 'service-desk/my-documents',
        name: 'service-desk.my-documents',
        component: () => import('@/modules/service-desk/pages/MyDocumentsPage.vue'),
        meta: { title: 'Bandeja de documentos' },
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
