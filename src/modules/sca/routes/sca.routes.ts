export default [
    // ── Docentes ──────────────────────────────────────────────────────
    {
        path: 'sca/teachers',
        name: 'sca.teachers',
        component: () => import('@/modules/sca/pages/TeachersPage.vue'),
        meta: { title: 'Docentes' },
    },
    {
        path: 'sca/teachers/create',
        name: 'sca.teachers.create',
        component: () => import('@/modules/sca/pages/teacher/TeacherCreate.vue'),
        meta: { title: 'Registrar Docente' },
    },
    {
        path: 'sca/teachers/:id/edit',
        name: 'sca.teachers.edit',
        component: () => import('@/modules/sca/pages/teacher/TeacherEdit.vue'),
        meta: { title: 'Editar Docente' },
    },
    {
        path: 'sca/teachers/:id/delete',
        name: 'sca.teachers.delete',
        component: () => import('@/modules/sca/pages/teacher/TeacherDelete.vue'),
        meta: { title: 'Eliminar Docente' },
    },

    // ── Docentes por Carrera (dual-list) ───────────────────────────────
    {
        path: 'sca/teachers-by-career',
        name: 'sca.teachers-by-career',
        component: () => import('@/modules/sca/pages/TeachersByCareerPage.vue'),
        meta: { title: 'Docentes por Carrera' },
    },

    // ── Aulas por Carrera (dual-list) ────────────────────────────────
    {
        path: 'sca/places-by-career',
        name: 'sca.places-by-career',
        component: () => import('@/modules/sca/pages/PlacesByCareerPage.vue'),
        meta: { title: 'Aulas por Carrera' },
    },

    // ── Calendario Escolar ────────────────────────────────────────────
    {
        path: 'sca/school-calendars',
        name: 'sca.school-calendars',
        component: () => import('@/modules/sca/pages/SchoolCalendarsPage.vue'),
        meta: { title: 'Calendarios Escolares' },
    },
    {
        path: 'sca/school-calendars/create',
        name: 'sca.school-calendars.create',
        component: () => import('@/modules/sca/pages/school-calendar/SchoolCalendarCreate.vue'),
        meta: { title: 'Crear Calendario' },
    },
    {
        path: 'sca/school-calendars/:id/edit',
        name: 'sca.school-calendars.edit',
        component: () => import('@/modules/sca/pages/school-calendar/SchoolCalendarEdit.vue'),
        meta: { title: 'Gestionar Calendario' },
    },
    {
        path: 'sca/school-calendars/:id/delete',
        name: 'sca.school-calendars.delete',
        component: () => import('@/modules/sca/pages/school-calendar/SchoolCalendarDelete.vue'),
        meta: { title: 'Eliminar Calendario' },
    },

    // ── Configuración de Carga Académica ──────────────────────────────
    {
        path: 'sca/academic-load-configs',
        name: 'sca.academic-load-configs',
        component: () => import('@/modules/sca/pages/AcademicLoadConfigsPage.vue'),
        meta: { title: 'Configuración de Carga Académica' },
    },
    {
        path: 'sca/academic-load-configs/create',
        name: 'sca.academic-load-configs.create',
        component: () => import('@/modules/sca/pages/academic-load-config/AcademicLoadConfigCreate.vue'),
        meta: { title: 'Crear Configuración' },
    },
    {
        path: 'sca/academic-load-configs/:id/edit',
        name: 'sca.academic-load-configs.edit',
        component: () => import('@/modules/sca/pages/academic-load-config/AcademicLoadConfigEdit.vue'),
        meta: { title: 'Gestionar Configuración' },
    },

    // ── Paquete de Materias ──────────────────────────────────────────
    {
        path: 'sca/subject-package',
        name: 'sca.subject-package',
        component: () => import('@/modules/sca/pages/SubjectPackagePage.vue'),
        meta: { title: 'Paquete de Materias' },
    },

    // ── Solicitud de Materias (Docentes) ─────────────────────────────
    {
        path: 'sca/teacher-requests',
        name: 'sca.teacher-requests',
        component: () => import('@/modules/sca/pages/TeacherRequestsPage.vue'),
        meta: { title: 'Solicitud de Materias' },
    },

    // ── Validación de Paquetes ────────────────────────────────────────
    {
        path: 'sca/package-validation',
        name: 'sca.package-validation',
        component: () => import('@/modules/sca/pages/PackageValidationPage.vue'),
        meta: { title: 'Validación de Paquetes' },
    },

    // ── Asignación Docente ────────────────────────────────────────────
    {
        path: 'sca/teacher-assignments',
        name: 'sca.teacher-assignments',
        component: () => import('@/modules/sca/pages/TeacherAssignmentPage.vue'),
        meta: { title: 'Asignación Docente' },
    },

    // ── Tipos de Horas Complementarias (catálogo) ─────────────────────
    {
        path: 'sca/complementary-hour-types',
        name: 'sca.complementary-hour-types',
        component: () => import('@/modules/sca/pages/ComplementaryHourTypesPage.vue'),
        meta: { title: 'Tipos de Horas Complementarias' },
    },

    // ── Reportes de Carga Académica ──────────────────────────────────
    {
        path: 'sca/reports',
        name: 'sca.reports',
        component: () => import('@/modules/sca/pages/ScaReportsPage.vue'),
        meta: { title: 'Reportes — Carga Académica' },
    },

    // ── Gestión ──────────────────────────────────────────────────────
    {
        path: 'sca/assign-vacancy',
        name: 'sca.assign-vacancy',
        component: () => import('@/modules/sca/pages/AssignVacancyPage.vue'),
        meta: { title: 'Asignar Docente a Vacante' },
    },
    {
        path: 'sca/change-teacher',
        name: 'sca.change-teacher',
        component: () => import('@/modules/sca/pages/ChangeTeacherPage.vue'),
        meta: { title: 'Cambiar Docente de Asignatura' },
    },
    {
        path: 'sca/swap-subjects',
        name: 'sca.swap-subjects',
        component: () => import('@/modules/sca/pages/SwapSubjectsPage.vue'),
        meta: { title: 'Intercambiar Materias' },
    },
    {
        path: 'sca/late-opening',
        name: 'sca.late-opening',
        component: () => import('@/modules/sca/pages/LateOpeningPage.vue'),
        meta: { title: 'Apertura Tardía' },
    },
]
