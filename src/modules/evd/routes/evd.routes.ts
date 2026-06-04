export default [
    {
        path: 'evd/my-evaluations',
        name: 'evd.my-evaluations',
        component: () => import('@/modules/evd/pages/MyEvdPage.vue'),
        meta: { title: 'Mi Evaluación Docente' },
    },

    // Admin — Resultados
    {
        path: 'evd/admin/periods',
        name: 'evd.admin.results',
        component: () => import('@/modules/evd/pages/EvdResultsPage.vue'),
        meta: { title: 'Resultados de Evaluación' },
    },
    {
        path: 'evd/admin/periods/teacher/:teacherId',
        name: 'evd.admin.teacher-detail',
        component: () => import('@/modules/evd/pages/EvdTeacherDetailPage.vue'),
        meta: { title: 'Detalle docente' },
        props: true,
    },

    // Admin — Concentrados
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
        meta: { title: 'Avance por Grupos · EVD' },
    },

    // Admin — Gestión de periodos
    {
        path: 'evd/admin/open',
        name: 'evd.admin.open',
        component: () => import('@/modules/evd/pages/EvdPeriodsAdminPage.vue'),
        meta: { title: 'Aperturar Evaluación Docente' },
    },
]
