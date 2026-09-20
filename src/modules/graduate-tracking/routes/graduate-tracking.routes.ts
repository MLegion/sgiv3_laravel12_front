export default [
    {
        path: 'graduate-tracking/waves',
        name: 'graduate-tracking.waves',
        component: () => import('@/modules/graduate-tracking/pages/WavesPage.vue'),
        meta: { title: 'Seguimiento de Egresados' },
    },
    {
        path: 'graduate-tracking/waves/:id',
        name: 'graduate-tracking.wave-detail',
        component: () => import('@/modules/graduate-tracking/pages/WaveDetailPage.vue'),
        meta: { title: 'Oleada de Seguimiento' },
        props: true,
    },
]
