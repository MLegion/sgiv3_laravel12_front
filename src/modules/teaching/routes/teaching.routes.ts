export default [
    {
        path: 'teaching/planeacion',
        name: 'teaching.planeacion',
        component: () => import('@/modules/teaching/pages/PlaneacionPage.vue'),
        meta: { title: 'Planeación' },
    },
    {
        path: 'teaching/listas-oficiales',
        name: 'teaching.listas-oficiales',
        component: () => import('@/modules/teaching/pages/ListasOficialesPage.vue'),
        meta: { title: 'Listas oficiales' },
    },
    {
        path: 'teaching/seguimiento',
        name: 'teaching.seguimiento',
        component: () => import('@/modules/teaching/pages/SeguimientoPage.vue'),
        meta: { title: 'Seguimiento' },
    },
]
