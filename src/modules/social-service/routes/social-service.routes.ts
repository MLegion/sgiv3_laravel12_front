export default [
    // ── Prestador ─────────────────────────────────────────────────────
    {
        path: 'social-service/me',
        name: 'social-service.me',
        component: () => import('@/modules/social-service/pages/MySocialServicePage.vue'),
        meta: { title: 'Mi Servicio Social' },
    },

    // ── Coordinador / Jefe de carrera / Asesor ────────────────────────
    {
        path: 'social-service/list',
        name: 'social-service.list',
        component: () => import('@/modules/social-service/pages/SocialServiceListPage.vue'),
        meta: { title: 'Prestadores' },
    },
    {
        path: 'social-service/list/:id',
        name: 'social-service.detail',
        component: () => import('@/modules/social-service/pages/SocialServiceDetailPage.vue'),
        meta: { title: 'Detalle de Servicio Social' },
        props: true,
    },
    {
        path: 'social-service/programs',
        name: 'social-service.programs',
        component: () => import('@/modules/social-service/pages/SocialServiceProgramsPage.vue'),
        meta: { title: 'Banco de Programas' },
    },
]
