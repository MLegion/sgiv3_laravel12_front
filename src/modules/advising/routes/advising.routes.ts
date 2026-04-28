export default [
    // ── Alumno ────────────────────────────────────────────────────────
    {
        path: 'advising/my-advising',
        name: 'advising.my-advising',
        component: () => import('@/modules/advising/pages/MyAdvisingPage.vue'),
        meta: { title: 'Mi Asesoría' },
    },

    // ── Asesor ────────────────────────────────────────────────────────
    {
        path: 'advising/review',
        name: 'advising.review.list',
        component: () => import('@/modules/advising/pages/AdvisingReviewListPage.vue'),
        meta: { title: 'Asesorías por Revisar' },
    },
    {
        path: 'advising/review/:id',
        name: 'advising.review.detail',
        component: () => import('@/modules/advising/pages/AdvisingReviewDetailPage.vue'),
        meta: { title: 'Revisión de Asesoría' },
    },

    // ── Admin ────────────────────────────────────────────────────────
    {
        path: 'advising/phases',
        name: 'advising.phases',
        component: () => import('@/modules/advising/pages/AdvisingPhasesPage.vue'),
        meta: { title: 'Fases de Asesoría' },
    },
]
