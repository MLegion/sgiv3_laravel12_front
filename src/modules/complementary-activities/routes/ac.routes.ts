export default [
    {
        path: 'complementary-activities',
        name: 'ac.activities',
        component: () => import('@/modules/complementary-activities/pages/ActivitiesPage.vue'),
        meta: { title: 'Actividades Complementarias' },
    },
    {
        path: 'complementary-activities/:id',
        name: 'ac.activity-detail',
        component: () => import('@/modules/complementary-activities/pages/ActivityDetailPage.vue'),
        meta: { title: 'Detalle de Actividad' },
        props: true,
    },
]
