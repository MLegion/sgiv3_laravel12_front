export default [
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

    // Admitted Applicants (inscripción)
    {
        path: 'school-services/admitted-applicants',
        name: 'school-services.admitted-applicants',
        component: () => import('@/modules/school-services/pages/AdmittedApplicantsPage.vue'),
        meta: { title: 'Aspirantes Admitidos' },
    },

    // Modalities
    {
        path: 'school-services/modalities',
        name: 'school-services.modalities',
        component: () => import('@/modules/school-services/pages/ModalitiesPage.vue'),
        meta: { title: 'Modalidades' },
    },
    {
        path: 'school-services/modalities/create',
        name: 'school-services.modalities.create',
        component: () => import('@/modules/school-services/pages/modality/ModalityCreate.vue'),
        meta: { title: 'Registrar - Modalidad' },
    },
    {
        path: 'school-services/modalities/:id',
        name: 'school-services.modalities.show',
        component: () => import('@/modules/school-services/pages/modality/ModalityShow.vue'),
        meta: { title: 'Detalle - Modalidad' },
    },
    {
        path: 'school-services/modalities/:id/edit',
        name: 'school-services.modalities.edit',
        component: () => import('@/modules/school-services/pages/modality/ModalityEdit.vue'),
        meta: { title: 'Editar - Modalidad' },
    },
    {
        path: 'school-services/modalities/:id/delete',
        name: 'school-services.modalities.delete',
        component: () => import('@/modules/school-services/pages/modality/ModalityDelete.vue'),
        meta: { title: 'Eliminar - Modalidad' },
    },

    // Campuses
    {
        path: 'school-services/campuses',
        name: 'school-services.campuses',
        component: () => import('@/modules/school-services/pages/CampusesPage.vue'),
        meta: { title: 'Planteles' },
    },
    {
        path: 'school-services/campuses/create',
        name: 'school-services.campuses.create',
        component: () => import('@/modules/school-services/pages/campus/CampusCreate.vue'),
        meta: { title: 'Registrar - Plantel' },
    },
    {
        path: 'school-services/campuses/:id',
        name: 'school-services.campuses.show',
        component: () => import('@/modules/school-services/pages/campus/CampusShow.vue'),
        meta: { title: 'Detalle - Plantel' },
    },
    {
        path: 'school-services/campuses/:id/edit',
        name: 'school-services.campuses.edit',
        component: () => import('@/modules/school-services/pages/campus/CampusEdit.vue'),
        meta: { title: 'Editar - Plantel' },
    },
    {
        path: 'school-services/campuses/:id/delete',
        name: 'school-services.campuses.delete',
        component: () => import('@/modules/school-services/pages/campus/CampusDelete.vue'),
        meta: { title: 'Eliminar - Plantel' },
    },

    // Buildings
    {
        path: 'school-services/buildings',
        name: 'school-services.buildings',
        component: () => import('@/modules/school-services/pages/BuildingsPage.vue'),
        meta: { title: 'Edificios' },
    },
    {
        path: 'school-services/buildings/create',
        name: 'school-services.buildings.create',
        component: () => import('@/modules/school-services/pages/building/BuildingCreate.vue'),
        meta: { title: 'Registrar - Edificio' },
    },
    {
        path: 'school-services/buildings/:id',
        name: 'school-services.buildings.show',
        component: () => import('@/modules/school-services/pages/building/BuildingShow.vue'),
        meta: { title: 'Detalle - Edificio' },
    },
    {
        path: 'school-services/buildings/:id/edit',
        name: 'school-services.buildings.edit',
        component: () => import('@/modules/school-services/pages/building/BuildingEdit.vue'),
        meta: { title: 'Editar - Edificio' },
    },
    {
        path: 'school-services/buildings/:id/delete',
        name: 'school-services.buildings.delete',
        component: () => import('@/modules/school-services/pages/building/BuildingDelete.vue'),
        meta: { title: 'Eliminar - Edificio' },
    },

    // Places
    {
        path: 'school-services/places',
        name: 'school-services.places',
        component: () => import('@/modules/school-services/pages/PlacesPage.vue'),
        meta: { title: 'Espacios' },
    },
    {
        path: 'school-services/places/create',
        name: 'school-services.places.create',
        component: () => import('@/modules/school-services/pages/place/PlaceCreate.vue'),
        meta: { title: 'Registrar - Espacio' },
    },
    {
        path: 'school-services/places/:id/edit',
        name: 'school-services.places.edit',
        component: () => import('@/modules/school-services/pages/place/PlaceEdit.vue'),
        meta: { title: 'Editar - Espacio' },
    },
    {
        path: 'school-services/places/:id/delete',
        name: 'school-services.places.delete',
        component: () => import('@/modules/school-services/pages/place/PlaceDelete.vue'),
        meta: { title: 'Eliminar - Espacio' },
    },

    // College Academic Periods (institución adopta y ajusta un periodo global)
    {
        path: 'school-services/college-academic-periods',
        name: 'school-services.college-academic-periods',
        component: () => import('@/modules/school-services/pages/CollegeAcademicPeriodsPage.vue'),
        meta: { title: 'Mis Periodos Académicos' },
    },
    {
        path: 'school-services/college-academic-periods/create',
        name: 'school-services.college-academic-periods.create',
        component: () => import('@/modules/school-services/pages/college-academic-period/CollegeAcademicPeriodCreate.vue'),
        meta: { title: 'Adoptar - Periodo Académico' },
    },
    {
        path: 'school-services/college-academic-periods/:id',
        name: 'school-services.college-academic-periods.show',
        component: () => import('@/modules/school-services/pages/college-academic-period/CollegeAcademicPeriodShow.vue'),
        meta: { title: 'Detalle - Periodo Institucional' },
    },
    {
        path: 'school-services/college-academic-periods/:id/edit',
        name: 'school-services.college-academic-periods.edit',
        component: () => import('@/modules/school-services/pages/college-academic-period/CollegeAcademicPeriodEdit.vue'),
        meta: { title: 'Ajustar - Periodo Institucional' },
    },
    {
        path: 'school-services/college-academic-periods/:id/delete',
        name: 'school-services.college-academic-periods.delete',
        component: () => import('@/modules/school-services/pages/college-academic-period/CollegeAcademicPeriodDelete.vue'),
        meta: { title: 'Eliminar - Periodo Institucional' },
    },

    // Academic Offers
    {
        path: 'school-services/academic-offers',
        name: 'school-services.academic-offers',
        component: () => import('@/modules/school-services/pages/AcademicOffersPage.vue'),
        meta: { title: 'Oferta Académica' },
    },
    {
        path: 'school-services/academic-offers/create',
        name: 'school-services.academic-offers.create',
        component: () => import('@/modules/school-services/pages/academic-offer/AcademicOfferCreate.vue'),
        meta: { title: 'Registrar - Oferta Académica' },
    },
    {
        path: 'school-services/academic-offers/:id',
        name: 'school-services.academic-offers.show',
        component: () => import('@/modules/school-services/pages/academic-offer/AcademicOfferShow.vue'),
        meta: { title: 'Detalle - Oferta Académica' },
    },
    {
        path: 'school-services/academic-offers/:id/edit',
        name: 'school-services.academic-offers.edit',
        component: () => import('@/modules/school-services/pages/academic-offer/AcademicOfferEdit.vue'),
        meta: { title: 'Editar - Oferta Académica' },
    },
    {
        path: 'school-services/academic-offers/:id/delete',
        name: 'school-services.academic-offers.delete',
        component: () => import('@/modules/school-services/pages/academic-offer/AcademicOfferDelete.vue'),
        meta: { title: 'Eliminar - Oferta Académica' },
    },

    // Offer Study Plans
    {
        path: 'school-services/offer-study-plans',
        name: 'school-services.offer-study-plans',
        component: () => import('@/modules/school-services/pages/OfferStudyPlansPage.vue'),
        meta: { title: 'Oferta por Plan de Estudio' },
    },
    {
        path: 'school-services/offer-study-plans/:offerId/study-plans/create',
        name: 'school-services.offer-study-plans.create',
        component: () => import('@/modules/school-services/pages/offer-study-plan/OfferStudyPlanCreate.vue'),
        meta: { title: 'Agregar Plan de Estudio' },
    },
    {
        path: 'school-services/offer-study-plans/:offerId/study-plans/:id/delete',
        name: 'school-services.offer-study-plans.delete',
        component: () => import('@/modules/school-services/pages/offer-study-plan/OfferStudyPlanDelete.vue'),
        meta: { title: 'Eliminar Plan de Estudio' },
    },

    // Approval Types
    {
        path: 'school-services/approval-types',
        name: 'school-services.approval-types',
        component: () => import('@/modules/school-services/pages/ApprovalTypesPage.vue'),
        meta: { title: 'Tipos de Aprobacion' },
    },
    {
        path: 'school-services/approval-types/create',
        name: 'school-services.approval-types.create',
        component: () => import('@/modules/school-services/pages/approval-type/ApprovalTypeCreate.vue'),
        meta: { title: 'Registrar - Tipo de Aprobacion' },
    },
    {
        path: 'school-services/approval-types/:id',
        name: 'school-services.approval-types.show',
        component: () => import('@/modules/school-services/pages/approval-type/ApprovalTypeShow.vue'),
        meta: { title: 'Detalle - Tipo de Aprobacion' },
    },
    {
        path: 'school-services/approval-types/:id/edit',
        name: 'school-services.approval-types.edit',
        component: () => import('@/modules/school-services/pages/approval-type/ApprovalTypeEdit.vue'),
        meta: { title: 'Editar - Tipo de Aprobacion' },
    },
    {
        path: 'school-services/approval-types/:id/delete',
        name: 'school-services.approval-types.delete',
        component: () => import('@/modules/school-services/pages/approval-type/ApprovalTypeDelete.vue'),
        meta: { title: 'Eliminar - Tipo de Aprobacion' },
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
]
