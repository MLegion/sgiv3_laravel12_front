export default [
    // Portal del Aspirante — secciones independientes (rol APPLICANT)
    { path: 'admissions/portal/personal',     name: 'admissions.portal.personal',     component: () => import('@/modules/admissions/pages/portal/PortalPersonalPage.vue'),     meta: { title: 'Información General' } },
    { path: 'admissions/portal/ext-personal', name: 'admissions.portal.ext-personal', component: () => import('@/modules/admissions/pages/portal/PortalExtPersonalPage.vue'), meta: { title: 'Datos Personales' } },
    { path: 'admissions/portal/estudios',     name: 'admissions.portal.estudios',     component: () => import('@/modules/admissions/pages/portal/PortalEstudiosPage.vue'),     meta: { title: 'Último Nivel de Estudio' } },
    { path: 'admissions/portal/contactos',    name: 'admissions.portal.contactos',    component: () => import('@/modules/admissions/pages/portal/PortalContactosPage.vue'),    meta: { title: 'Contactos' } },
    { path: 'admissions/portal/preventivos',  name: 'admissions.portal.preventivos',  component: () => import('@/modules/admissions/pages/portal/PortalPreventivosPage.vue'),  meta: { title: 'Preventivos' } },
    { path: 'admissions/portal/otros',         name: 'admissions.portal.otros',        component: () => import('@/modules/admissions/pages/portal/PortalOtrosPage.vue'),        meta: { title: 'Otros Datos' } },
    { path: 'admissions/portal/inscripcion',  name: 'admissions.portal.inscripcion',  component: () => import('@/modules/admissions/pages/portal/PortalInscripcionPage.vue'),  meta: { title: 'Preficha' } },
    { path: 'admissions/portal/documentos',   name: 'admissions.portal.documentos',   component: () => import('@/modules/admissions/pages/portal/PortalDocumentosPage.vue'),   meta: { title: 'Carga de Documentos' } },
    { path: 'admissions/portal/ficha',        name: 'admissions.portal.ficha',        component: () => import('@/modules/admissions/pages/portal/PortalFichaPage.vue'),        meta: { title: 'Ficha' } },
    { path: 'admissions/portal/examen',       name: 'admissions.portal.examen',       component: () => import('@/modules/admissions/pages/portal/PortalExamenPage.vue'),       meta: { title: 'Examen de Admisión Online' } },
    { path: 'admissions/portal/password',     name: 'admissions.portal.password',     component: () => import('@/modules/admissions/pages/portal/PortalPasswordPage.vue'),     meta: { title: 'Cambiar Contraseña' } },
    // Ruta base del portal → redirige a personal
    {
        path: 'admissions/portal',
        name: 'admissions.portal',
        redirect: { name: 'admissions.portal.personal' },
    },

    // Admission Config
    {
        path: 'admissions/config',
        name: 'admissions.config',
        component: () => import('@/modules/admissions/pages/AdmissionConfigPage.vue'),
        meta: { title: 'Configuración de Admisión' },
    },

    // Origin Schools
    {
        path: 'admissions/origin-schools',
        name: 'admissions.origin-schools',
        component: () => import('@/modules/admissions/pages/OriginSchoolsPage.vue'),
        meta: { title: 'Escuelas de Procedencia' },
    },
    {
        path: 'admissions/origin-schools/create',
        name: 'admissions.origin-schools.create',
        component: () => import('@/modules/admissions/pages/origin-school/OriginSchoolCreate.vue'),
        meta: { title: 'Registrar - Escuela de Procedencia' },
    },
    {
        path: 'admissions/origin-schools/:id',
        name: 'admissions.origin-schools.show',
        component: () => import('@/modules/admissions/pages/origin-school/OriginSchoolShow.vue'),
        meta: { title: 'Detalle - Escuela de Procedencia' },
    },
    {
        path: 'admissions/origin-schools/:id/edit',
        name: 'admissions.origin-schools.edit',
        component: () => import('@/modules/admissions/pages/origin-school/OriginSchoolEdit.vue'),
        meta: { title: 'Editar - Escuela de Procedencia' },
    },
    {
        path: 'admissions/origin-schools/:id/delete',
        name: 'admissions.origin-schools.delete',
        component: () => import('@/modules/admissions/pages/origin-school/OriginSchoolDelete.vue'),
        meta: { title: 'Eliminar - Escuela de Procedencia' },
    },

    // Document Types
    {
        path: 'admissions/document-types',
        name: 'admissions.document-types',
        component: () => import('@/modules/admissions/pages/DocumentTypesPage.vue'),
        meta: { title: 'Tipos de Documento' },
    },
    {
        path: 'admissions/document-types/create',
        name: 'admissions.document-types.create',
        component: () => import('@/modules/admissions/pages/document-type/DocumentTypeCreate.vue'),
        meta: { title: 'Registrar - Tipo de Documento' },
    },
    {
        path: 'admissions/document-types/:id',
        name: 'admissions.document-types.show',
        component: () => import('@/modules/admissions/pages/document-type/DocumentTypeShow.vue'),
        meta: { title: 'Detalle - Tipo de Documento' },
    },
    {
        path: 'admissions/document-types/:id/edit',
        name: 'admissions.document-types.edit',
        component: () => import('@/modules/admissions/pages/document-type/DocumentTypeEdit.vue'),
        meta: { title: 'Editar - Tipo de Documento' },
    },
    {
        path: 'admissions/document-types/:id/delete',
        name: 'admissions.document-types.delete',
        component: () => import('@/modules/admissions/pages/document-type/DocumentTypeDelete.vue'),
        meta: { title: 'Eliminar - Tipo de Documento' },
    },

    // Global Required Documents
    {
        path: 'admissions/global-required-documents',
        name: 'admissions.global-required-documents',
        component: () => import('@/modules/admissions/pages/GlobalRequiredDocumentsPage.vue'),
        meta: { title: 'Docs. Requeridos Institución' },
    },
    {
        path: 'admissions/global-required-documents/create',
        name: 'admissions.global-required-documents.create',
        component: () => import('@/modules/admissions/pages/global-required-document/GlobalRequiredDocumentCreate.vue'),
        meta: { title: 'Agregar - Documento Requerido Institución' },
    },
    {
        path: 'admissions/global-required-documents/:id',
        name: 'admissions.global-required-documents.show',
        component: () => import('@/modules/admissions/pages/global-required-document/GlobalRequiredDocumentShow.vue'),
        meta: { title: 'Detalle - Documento Requerido Institución' },
    },
    {
        path: 'admissions/global-required-documents/:id/edit',
        name: 'admissions.global-required-documents.edit',
        component: () => import('@/modules/admissions/pages/global-required-document/GlobalRequiredDocumentEdit.vue'),
        meta: { title: 'Editar - Documento Requerido Institución' },
    },
    {
        path: 'admissions/global-required-documents/:id/delete',
        name: 'admissions.global-required-documents.delete',
        component: () => import('@/modules/admissions/pages/global-required-document/GlobalRequiredDocumentDelete.vue'),
        meta: { title: 'Eliminar - Documento Requerido Institución' },
    },

    // Offer Required Documents
    {
        path: 'admissions/offer-required-documents',
        name: 'admissions.offer-required-documents',
        component: () => import('@/modules/admissions/pages/OfferRequiredDocumentsPage.vue'),
        meta: { title: 'Docs. Requeridos por Oferta' },
    },
    {
        path: 'admissions/offer-required-documents/create',
        name: 'admissions.offer-required-documents.create',
        component: () => import('@/modules/admissions/pages/offer-required-document/OfferRequiredDocumentCreate.vue'),
        meta: { title: 'Agregar - Documento Requerido por Oferta' },
    },
    {
        path: 'admissions/offer-required-documents/:id',
        name: 'admissions.offer-required-documents.show',
        component: () => import('@/modules/admissions/pages/offer-required-document/OfferRequiredDocumentShow.vue'),
        meta: { title: 'Detalle - Documento Requerido por Oferta' },
    },
    {
        path: 'admissions/offer-required-documents/:id/edit',
        name: 'admissions.offer-required-documents.edit',
        component: () => import('@/modules/admissions/pages/offer-required-document/OfferRequiredDocumentEdit.vue'),
        meta: { title: 'Editar - Documento Requerido por Oferta' },
    },
    {
        path: 'admissions/offer-required-documents/:id/delete',
        name: 'admissions.offer-required-documents.delete',
        component: () => import('@/modules/admissions/pages/offer-required-document/OfferRequiredDocumentDelete.vue'),
        meta: { title: 'Eliminar - Documento Requerido por Oferta' },
    },

    // Applicant Statuses
    {
        path: 'admissions/applicant-statuses',
        name: 'admissions.applicant-statuses',
        component: () => import('@/modules/admissions/pages/ApplicantStatusesPage.vue'),
        meta: { title: 'Estados de Aspirante' },
    },

    // Enrollment Windows
    {
        path: 'admissions/enrollment-windows',
        name: 'admissions.enrollment-windows',
        component: () => import('@/modules/admissions/pages/EnrollmentWindowsPage.vue'),
        meta: { title: 'Cortes de Inscripción' },
    },

    // Applicant Scores
    {
        path: 'admissions/applicants/scores',
        name: 'admissions.applicants.scores',
        component: () => import('@/modules/admissions/pages/ApplicantScoresPage.vue'),
        meta: { title: 'Cargar Resultados de Examen' },
    },

    // Applicant Ranking / Admisión masiva
    {
        path: 'admissions/applicants/ranking',
        name: 'admissions.applicants.ranking',
        component: () => import('@/modules/admissions/pages/ApplicantRankingPage.vue'),
        meta: { title: 'Cuadro de Resultados' },
    },

    // Applicants
    {
        path: 'admissions/applicants',
        name: 'admissions.applicants',
        component: () => import('@/modules/admissions/pages/ApplicantsPage.vue'),
        meta: { title: 'Aspirantes' },
    },
    {
        path: 'admissions/applicants/create',
        name: 'admissions.applicants.create',
        component: () => import('@/modules/admissions/pages/applicant/ApplicantCreate.vue'),
        meta: { title: 'Registrar - Aspirante' },
    },
    {
        path: 'admissions/applicants/:id',
        name: 'admissions.applicants.show',
        component: () => import('@/modules/admissions/pages/applicant/ApplicantShow.vue'),
        meta: { title: 'Detalle - Aspirante' },
    },
    {
        path: 'admissions/applicants/:id/edit',
        name: 'admissions.applicants.edit',
        component: () => import('@/modules/admissions/pages/applicant/ApplicantEdit.vue'),
        meta: { title: 'Editar - Aspirante' },
    },
    {
        path: 'admissions/applicants/:id/delete',
        name: 'admissions.applicants.delete',
        component: () => import('@/modules/admissions/pages/applicant/ApplicantDelete.vue'),
        meta: { title: 'Eliminar - Aspirante' },
    },

    // Applicant Documents
    {
        path: 'admissions/applicants/:applicantId/documents',
        name: 'admissions.applicant-documents',
        component: () => import('@/modules/admissions/pages/ApplicantDocumentsPage.vue'),
        meta: { title: 'Documentos - Aspirante' },
    },
    {
        path: 'admissions/applicants/:applicantId/documents/create',
        name: 'admissions.applicant-documents.create',
        component: () => import('@/modules/admissions/pages/applicant-document/ApplicantDocumentCreate.vue'),
        meta: { title: 'Subir - Documento de Aspirante' },
    },
    {
        path: 'admissions/applicants/:applicantId/documents/:id',
        name: 'admissions.applicant-documents.show',
        component: () => import('@/modules/admissions/pages/applicant-document/ApplicantDocumentShow.vue'),
        meta: { title: 'Detalle - Documento de Aspirante' },
    },
    {
        path: 'admissions/applicants/:applicantId/documents/:id/review',
        name: 'admissions.applicant-documents.review',
        component: () => import('@/modules/admissions/pages/applicant-document/ApplicantDocumentReview.vue'),
        meta: { title: 'Revisar - Documento de Aspirante' },
    },
    {
        path: 'admissions/applicants/:applicantId/documents/:id/delete',
        name: 'admissions.applicant-documents.delete',
        component: () => import('@/modules/admissions/pages/applicant-document/ApplicantDocumentDelete.vue'),
        meta: { title: 'Eliminar - Documento de Aspirante' },
    },

    // Catalogs: Scholarships
    {
        path: 'admissions/scholarships',
        name: 'admissions.scholarships',
        component: () => import('@/modules/admissions/pages/ScholarshipsPage.vue'),
        meta: { title: 'Becas' },
    },
    // Catalogs: Academic Areas
    {
        path: 'admissions/academic-areas',
        name: 'admissions.academic-areas',
        component: () => import('@/modules/admissions/pages/AcademicAreasPage.vue'),
        meta: { title: 'Áreas Académicas' },
    },
    // Catalogs: Disabilities
    {
        path: 'admissions/disabilities',
        name: 'admissions.disabilities',
        component: () => import('@/modules/admissions/pages/DisabilitiesPage.vue'),
        meta: { title: 'Discapacidades' },
    },
    // Catalogs: Indigenous Groups
    {
        path: 'admissions/indigenous-groups',
        name: 'admissions.indigenous-groups',
        component: () => import('@/modules/admissions/pages/IndigenousGroupsPage.vue'),
        meta: { title: 'Grupos Indígenas' },
    },
    // Catalogs: Indigenous Languages
    {
        path: 'admissions/indigenous-languages',
        name: 'admissions.indigenous-languages',
        component: () => import('@/modules/admissions/pages/IndigenousLanguagesPage.vue'),
        meta: { title: 'Lenguas Indígenas' },
    },
]
