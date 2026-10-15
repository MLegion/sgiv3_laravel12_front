export default [
    {
        path: 'tutoring/me',
        name: 'tutoring.me',
        component: () => import('@/modules/tutoring/pages/MyTutoringPage.vue'),
        meta: { title: 'Mi Tutoría' },
    },
    {
        path: 'tutoring/my-tutees',
        name: 'tutoring.my-tutees',
        component: () => import('@/modules/tutoring/pages/MyTuteesPage.vue'),
        meta: { title: 'Mis Tutorados' },
    },
    {
        path: 'tutoring/assignments',
        name: 'tutoring.assignments',
        component: () => import('@/modules/tutoring/pages/AssignmentsPage.vue'),
        meta: { title: 'Asignaciones de Tutoría' },
    },
    {
        path: 'tutoring/assignments/:id',
        name: 'tutoring.assignment-detail',
        component: () => import('@/modules/tutoring/pages/AssignmentDetailPage.vue'),
        meta: { title: 'Detalle de Asignación' },
        props: true,
    },
    {
        path: 'tutoring/closure',
        name: 'tutoring.closure',
        component: () => import('@/modules/tutoring/pages/ClosurePage.vue'),
        meta: { title: 'Cierre / Constancias' },
    },
    {
        path: 'tutoring/determination',
        name: 'tutoring.determination',
        component: () => import('@/modules/tutoring/pages/DeterminationPage.vue'),
        meta: { title: 'Determinación de tutorados' },
    },
    {
        path: 'tutoring/config',
        name: 'tutoring.config',
        component: () => import('@/modules/tutoring/pages/TutoringConfigPage.vue'),
        meta: { title: 'Configuración de Tutorías' },
    },
    {
        path: 'tutoring/referrals',
        name: 'tutoring.referrals',
        component: () => import('@/modules/tutoring/pages/ReferralsInboxPage.vue'),
        meta: { title: 'Canalizaciones' },
    },
    {
        path: 'tutoring/cedula',
        name: 'tutoring.cedula',
        component: () => import('@/modules/tutoring/pages/CedulaSetsPage.vue'),
        meta: { title: 'Instrumento de Cédula' },
    },
    {
        path: 'tutoring/referral-areas',
        name: 'tutoring.referral-areas',
        component: () => import('@/modules/tutoring/pages/ReferralAreasPage.vue'),
        meta: { title: 'Áreas de Canalización' },
    },
]
