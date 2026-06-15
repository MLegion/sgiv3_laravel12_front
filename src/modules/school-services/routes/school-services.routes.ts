export default [
    // Alumno
    {
        path: 'school-services/my-kardex',
        name: 'school-services.my-kardex',
        component: () => import('@/modules/school-services/pages/MyKardexPage.vue'),
        meta: { title: 'Mi Kardex' },
    },
    // Students
    {
        path: 'school-services/students',
        name: 'school-services.students',
        component: () => import('@/modules/school-services/pages/StudentsPage.vue'),
        meta: { title: 'Estudiantes' },
    },
    {
        path: 'school-services/students/:id',
        name: 'school-services.students.show',
        component: () => import('@/modules/school-services/pages/StudentShowPage.vue'),
        meta: { title: 'Detalle - Estudiante' },
    },

    // Period Closure (cierre formal de carga de calificaciones del periodo)
    {
        path: 'school-services/period-closure',
        name: 'school-services.period-closure.list',
        component: () => import('@/modules/school-services/pages/PeriodClosureListPage.vue'),
        meta: { title: 'Cierre de periodo escolar' },
    },
    {
        path: 'school-services/period-closure/:capId',
        name: 'school-services.period-closure',
        component: () => import('@/modules/school-services/pages/PeriodClosurePage.vue'),
        meta: { title: 'Cierre de carga del periodo' },
    },

    // Admitted Applicants (inscripción)
    {
        path: 'school-services/admitted-applicants',
        name: 'school-services.admitted-applicants',
        component: () => import('@/modules/school-services/pages/AdmittedApplicantsPage.vue'),
        meta: { title: 'Aspirantes Admitidos' },
    },
    {
        path: 'school-services/admitted-applicants/wizard',
        name: 'school-services.admitted-applicants.wizard',
        component: () => import('@/modules/school-services/pages/EnrollmentWizardPage.vue'),
        meta: { title: 'Inscripción asistida' },
    },

    // Modalities (alta/edición/eliminación en modal dentro del listado)
    {
        path: 'school-services/modalities',
        name: 'school-services.modalities',
        component: () => import('@/modules/school-services/pages/ModalitiesPage.vue'),
        meta: { title: 'Modalidades' },
    },

    // Campuses (alta/edición/eliminación en modal dentro del listado)
    {
        path: 'school-services/campuses',
        name: 'school-services.campuses',
        component: () => import('@/modules/school-services/pages/CampusesPage.vue'),
        meta: { title: 'Planteles' },
    },

    // Buildings (alta/edición/eliminación en modal dentro del listado)
    {
        path: 'school-services/buildings',
        name: 'school-services.buildings',
        component: () => import('@/modules/school-services/pages/BuildingsPage.vue'),
        meta: { title: 'Edificios' },
    },

    // Places (alta/edición/eliminación en modal dentro del listado)
    {
        path: 'school-services/places',
        name: 'school-services.places',
        component: () => import('@/modules/school-services/pages/PlacesPage.vue'),
        meta: { title: 'Espacios' },
    },

    // College Academic Periods (institución adopta y ajusta un periodo global)
    {
        path: 'school-services/college-academic-periods',
        name: 'school-services.college-academic-periods',
        component: () => import('@/modules/school-services/pages/CollegeAcademicPeriodsPage.vue'),
        meta: { title: 'Mis Periodos Académicos' },
    },
    {
        path: 'school-services/college-academic-periods/:id',
        name: 'school-services.college-academic-periods.show',
        component: () => import('@/modules/school-services/pages/college-academic-period/CollegeAcademicPeriodShow.vue'),
        meta: { title: 'Detalle - Periodo Institucional' },
    },

    // Academic Offers
    {
        path: 'school-services/academic-offers',
        name: 'school-services.academic-offers',
        component: () => import('@/modules/school-services/pages/AcademicOffersPage.vue'),
        meta: { title: 'Oferta Académica' },
    },
    {
        path: 'school-services/academic-offers/:id',
        name: 'school-services.academic-offers.show',
        component: () => import('@/modules/school-services/pages/academic-offer/AcademicOfferShow.vue'),
        meta: { title: 'Detalle - Oferta Académica' },
    },

    // Offer Study Plans (vincular/desvincular en modal dentro del listado)
    {
        path: 'school-services/offer-study-plans',
        name: 'school-services.offer-study-plans',
        component: () => import('@/modules/school-services/pages/OfferStudyPlansPage.vue'),
        meta: { title: 'Oferta por Plan de Estudio' },
    },

    // Approval Types (alta/edición/eliminación en modal dentro del listado)
    {
        path: 'school-services/approval-types',
        name: 'school-services.approval-types',
        component: () => import('@/modules/school-services/pages/ApprovalTypesPage.vue'),
        meta: { title: 'Tipos de Aprobacion' },
    },

    // Grade Import
    {
        path: 'school-services/grade-import',
        name: 'school-services.grade-import',
        component: () => import('@/modules/school-services/pages/GradeImportPage.vue'),
        meta: { title: 'Carga de Calificaciones' },
    },

    // College Career Settings
    {
        path: 'school-services/college-career-settings',
        name: 'school-services.college-career-settings',
        component: () => import('@/modules/school-services/pages/CollegeCareerSettingsPage.vue'),
        meta: { title: 'Configuración de Carreras' },
    },

    // Configuración general de Servicios Escolares (num_control, etc.)
    {
        path: 'school-services/config',
        name: 'school-services.config',
        component: () => import('@/modules/school-services/pages/SchoolServicesConfigPage.vue'),
        meta: { title: 'Configuración - Servicios Escolares' },
    },

    // Asignación de nuevo ingreso (la reinscripción va en una pantalla aparte)
    {
        path: 'school-services/group-assignment',
        name: 'school-services.group-assignment',
        component: () => import('@/modules/school-services/pages/StudentGroupAssignmentPage.vue'),
        meta: { title: 'Asignación de Nuevo Ingreso' },
    },
]
