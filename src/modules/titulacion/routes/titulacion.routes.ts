export default [
    {
        path: 'titulacion/me',
        name: 'titulacion.me',
        component: () => import('@/modules/titulacion/pages/MyTitulacionPage.vue'),
        meta: { title: 'Mi Titulación' },
    },
    {
        path: 'titulacion/records',
        name: 'titulacion.records',
        component: () => import('@/modules/titulacion/pages/RecordsPage.vue'),
        meta: { title: 'Expedientes de Titulación' },
    },
    {
        path: 'titulacion/records/:id',
        name: 'titulacion.record-detail',
        component: () => import('@/modules/titulacion/pages/RecordDetailPage.vue'),
        meta: { title: 'Expediente de Titulación' },
        props: true,
    },
    {
        path: 'titulacion/acts',
        name: 'titulacion.acts',
        component: () => import('@/modules/titulacion/pages/ActsPage.vue'),
        meta: { title: 'Actos de Titulación' },
    },
    {
        path: 'titulacion/my-jury',
        name: 'titulacion.my-jury',
        component: () => import('@/modules/titulacion/pages/MyJuryPage.vue'),
        meta: { title: 'Mis Actos (Sínodo)' },
    },
    {
        path: 'titulacion/rooms',
        name: 'titulacion.rooms',
        component: () => import('@/modules/titulacion/pages/RoomsPage.vue'),
        meta: { title: 'Aulas de Titulación' },
    },
]
