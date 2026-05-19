export default [
    {
        path: 'evd/my-evaluations',
        name: 'evd.my-evaluations',
        component: () => import('@/modules/evd/pages/MyEvdPage.vue'),
        meta: { title: 'Mi Evaluación Docente' },
    },

    // Admin
    {
        path: 'evd/admin/periods',
        name: 'evd.admin.periods',
        component: () => import('@/modules/evd/pages/EvdPeriodsPage.vue'),
        meta: { title: 'Resultados Evaluación Docente' },
    },
    {
        path: 'evd/admin/periods/:periodId/results',
        name: 'evd.admin.results',
        component: () => import('@/modules/evd/pages/EvdResultsPage.vue'),
        meta: { title: 'Resultados por docente' },
        props: true,
    },
    {
        path: 'evd/admin/periods/:periodId/teachers/:teacherId',
        name: 'evd.admin.teacher-detail',
        component: () => import('@/modules/evd/pages/EvdTeacherDetailPage.vue'),
        meta: { title: 'Detalle docente' },
        props: true,
    },
    {
        path: 'evd/admin/attendance',
        name: 'evd.admin.attendance',
        component: () => import('@/modules/evd/pages/EvdAttendancePage.vue'),
        meta: { title: 'Concentrado de Evaluación Docente' },
    },
    {
        path: 'evd/admin/subjects',
        name: 'evd.admin.subjects',
        component: () => import('@/modules/evd/pages/EvdSubjectsProgressPage.vue'),
        meta: { title: 'Avance por Materia · EVD' },
    },
    {
        path: 'evd/admin/open',
        name: 'evd.admin.open',
        component: () => import('@/modules/evd/pages/EvdOpenForModalitiesPage.vue'),
        meta: { title: 'Aperturar Evaluación Docente' },
    },
]
