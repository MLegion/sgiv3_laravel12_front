export default [
    // ── Alumno ────────────────────────────────────────────────────────
    {
        path: 'advising/my-advising',
        name: 'advising.my-advising',
        component: () => import('@/modules/advising/pages/MyAdvisingPage.vue'),
        meta: { title: 'Mi Asesoría' },
    },
    {
        path: 'advising/my-enrollment',
        name: 'advising.my-enrollment',
        component: () => import('@/modules/advising/pages/MyEnrollmentPage.vue'),
        meta: { title: 'Mi Reinscripción' },
    },
    {
        path: 'advising/requirement-exceptions',
        name: 'advising.requirement-exceptions',
        component: () => import('@/modules/advising/pages/RequirementExceptionsInboxPage.vue'),
        meta: { title: 'Excepciones de Requisitos' },
    },
    {
        path: 'advising/my-add-drop',
        name: 'advising.my-add-drop',
        component: () => import('@/modules/advising/pages/MyAddDropPage.vue'),
        meta: { title: 'Mis Altas y Bajas' },
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

    // ── Reinscripción (admin SES_MANAGER / CAREER_MANAGER / AD) ──────
    {
        path: 'advising/enrollments/groups',
        name: 'advising.enrollments.groups',
        component: () => import('@/modules/advising/pages/EnrollmentGroupsPage.vue'),
        meta: { title: 'Grupos del periodo' },
    },
    {
        path: 'advising/enrollments/groups/:groupId',
        name: 'advising.enrollments.group',
        component: () => import('@/modules/advising/pages/EnrollmentGroupDetailPage.vue'),
        meta: { title: 'Detalle de grupo' },
        props: true,
    },
    {
        path: 'advising/enrollments/assignments/:teacherAssignmentId',
        name: 'advising.enrollments.assignment',
        component: () => import('@/modules/advising/pages/EnrollmentAssignmentDetailPage.vue'),
        meta: { title: 'Lista de alumnos' },
        props: true,
    },
]
