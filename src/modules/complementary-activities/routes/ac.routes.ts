export default [
    {
        path: 'complementary-activities',
        name: 'ac.activities',
        component: () => import('@/modules/complementary-activities/pages/ActivitiesPage.vue'),
        meta: { title: 'Actividades Complementarias' },
    },
    {
        path: 'complementary-activities/mooc-platforms',
        name: 'ac.mooc-platforms',
        component: () => import('@/modules/complementary-activities/pages/MoocPlatformsPage.vue'),
        meta: { title: 'Plataformas MOOC' },
    },
    {
        path: 'complementary-activities/mooc-inbox',
        name: 'ac.mooc-inbox',
        component: () => import('@/modules/complementary-activities/pages/MoocInboxPage.vue'),
        meta: { title: 'Constancias MOOC por validar' },
    },
    {
        path: 'complementary-activities/my-mooc',
        name: 'ac.my-mooc',
        component: () => import('@/modules/complementary-activities/pages/MyMoocPage.vue'),
        meta: { title: 'Mis cursos MOOC' },
    },
    {
        path: 'complementary-activities/:id',
        name: 'ac.activity-detail',
        component: () => import('@/modules/complementary-activities/pages/ActivityDetailPage.vue'),
        meta: { title: 'Detalle de Actividad' },
        props: true,
    },
]
