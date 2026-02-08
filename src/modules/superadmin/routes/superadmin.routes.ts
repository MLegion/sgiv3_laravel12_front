export default [
    //###################################################################################
    //# COLLEGES                                                                        #
    //###################################################################################
    {
        path: 'superadmin/colleges',
        name: 'superadmin.colleges',
        component: () => import('@/modules/superadmin/pages/CollegesPage.vue'),
        meta: {
            title: 'Instituciones Educativas'
        }
    },
    {
        path: 'superadmin/colleges/create-with-admin',
        name: 'superadmin.colleges.create-with-admin',
        component: () => import('@/modules/superadmin/pages/colleges/CreateCollegeWithAdmin.vue'),
        meta: {
            title: 'Crear - Institución Educativa con Administrador'
        }
    },
    {
        path: 'superadmin/colleges/show/:id',
        name: 'superadmin.colleges.show',
        component: () => import('@/modules/superadmin/pages/colleges/CollegeShow.vue'),
        meta: {
            title: 'Información - Instituciones Educativas'
        }
    },
    {
        path: 'superadmin/colleges/edit/:id',
        name: 'superadmin.colleges.edit',
        component: () => import('@/modules/superadmin/pages/colleges/CollegeEdit.vue'),
        meta: {
            title: 'Actualizar - Instituciones Educativas'
        }
    },
    {
        path: 'superadmin/colleges/delete/:id',
        name: 'superadmin.colleges.delete',
        component: () => import('@/modules/superadmin/pages/colleges/CollegeDelete.vue'),
        meta: {
            title: 'Eliminar - Instituciones Educativas',
        },
    },
    //###################################################################################
    //# MODALITY TYPES                                                                  #
    //###################################################################################
    {
        path: 'superadmin/modality-types',
        name: 'superadmin.modalitytypes',
        component: () => import('@/modules/superadmin/pages/ModalityTypesPage.vue'),
        meta: {
            title: 'Tipos de Modalidad'
        }
    },
    {
        path: 'superadmin/modality-types/show/:id',
        name: 'superadmin.modalitytypes.show',
        component: () => import('@/modules/superadmin/pages/modalitytypes/ModalityTypeShow.vue'),
        meta: {
            title: 'Información - Tipo de Modalidad'
        }
    },
    {
        path: 'superadmin/modality-types/create',
        name: 'superadmin.modalitytypes.create',
        component: () => import('@/modules/superadmin/pages/modalitytypes/ModalityTypeCreate.vue'),
        meta: {
            title: 'Registrar - Tipo de Modalidad'
        }
    },
    {
        path: 'superadmin/modality-types/edit/:id',
        name: 'superadmin.modalitytypes.edit',
        component: () => import('@/modules/superadmin/pages/modalitytypes/ModalityTypeEdit.vue'),
        meta: {
            title: 'Actualizar - Tipo de Modalidad'
        }
    },
    {
        path: 'superadmin/modality-types/delete/:id',
        name: 'superadmin.modalitytypes.delete',
        component: () => import('@/modules/superadmin/pages/modalitytypes/ModalityTypeDelete.vue'),
        meta: {
            title: 'Eliminar - Tipo de Modalidad',
        },
    },
    //###################################################################################
    //# CAREERS                                                                         #
    //###################################################################################
    {
        path: 'superadmin/careers',
        name: 'superadmin.careers',
        component: () => import('@/modules/superadmin/pages/CareersPage.vue'),
        meta: {
            title: 'Carreras Profesionales'
        }
    },
    {
        path: 'superadmin/careers/validate/:id',
        name: 'superadmin.careers.approve',
        component: () => import('@/modules/superadmin/pages/careers/CareerValidate.vue'),
        meta: {
            title: 'Válidar - Carrera Profesional'
        }
    },
    {
        path: 'superadmin/careers/show/:id',
        name: 'superadmin.careers.show',
        component: () => import('@/modules/superadmin/pages/careers/CareerShow.vue'),
        meta: {
            title: 'Información - Carrera Profesional'
        }
    },
    {
        path: 'superadmin/careers/create',
        name: 'superadmin.careers.create',
        component: () => import('@/modules/superadmin/pages/careers/CareerCreate.vue'),
        meta: {
            title: 'Registrar - Carrera Profesional'
        }
    },
    {
        path: 'superadmin/careers/edit/:id',
        name: 'superadmin.careers.edit',
        component: () => import('@/modules/superadmin/pages/careers/CareerEdit.vue'),
        meta: {
            title: 'Actualizar - Carrera Profesional'
        }
    },
    {
        path: 'superadmin/careers/delete/:id',
        name: 'superadmin.careers.delete',
        component: () => import('@/modules/superadmin/pages/careers/CareerDelete.vue'),
        meta: {
            title: 'Eliminar - Carrera Profesional',
        },
    },
    //###################################################################################
    //# STUDY PLANS                                                                     #
    //###################################################################################
    {
        path: 'superadmin/study-plans',
        name: 'superadmin.studyplans',
        component: () => import('@/modules/superadmin/pages/StudyPlansPage.vue'),
        meta: {
            title: 'Plan de Estudios'
        }
    },
    {
        path: 'superadmin/study-plans/show/:id',
        name: 'superadmin.studyplans.show',
        component: () => import('@/modules/superadmin/pages/studyplans/StudyPlanShow.vue'),
        meta: {
            title: 'Información - Plan de Estudios'
        }
    },
    {
        path: 'superadmin/study-plans/create',
        name: 'superadmin.studyplans.create',
        component: () => import('@/modules/superadmin/pages/studyplans/StudyPlanCreate.vue'),
        meta: {
            title: 'Registrar - Plan de Estudios'
        }
    },
    {
        path: 'superadmin/study-plans/edit/:id',
        name: 'superadmin.studyplans.edit',
        component: () => import('@/modules/superadmin/pages/studyplans/StudyPlanEdit.vue'),
        meta: {
            title: 'Actualizar - Plan de Estudios'
        }
    },
    {
        path: 'superadmin/study-plans/delete/:id',
        name: 'superadmin.studyplans.delete',
        component: () => import('@/modules/superadmin/pages/studyplans/StudyPlanDelete.vue'),
        meta: {
            title: 'Eliminar - Plan de Estudios',
        },
    },
    {
        path: 'superadmin/study-plans/editor/:id',
        name: 'superadmin.studyplans.editor',
        component: () => import('@/modules/superadmin/pages/studyplans/StudyPlanEditor.vue'),
        meta: {
            title: 'Editor de Reticulas - Plan de Estudios',
        },
    },
    //###################################################################################
    //# SUBJECTS                                                                        #
    //###################################################################################
    {
        path: 'superadmin/subjects',
        name: 'superadmin.subjects',
        component: () => import('@/modules/superadmin/pages/SubjectsPage.vue'),
        meta: {
            title: 'Materias'
        }
    },
    {
        path: 'superadmin/subjects/validate/:id',
        name: 'superadmin.subjects.approve',
        component: () => import('@/modules/superadmin/pages/subjects/SubjectValidate.vue'),
        meta: {
            title: 'Válidar - Materia'
        }
    },
    {
        path: 'superadmin/subjects/show/:id',
        name: 'superadmin.subjects.show',
        component: () => import('@/modules/superadmin/pages/subjects/SubjectShow.vue'),
        meta: {
            title: 'Información - Materia'
        }
    },
    {
        path: 'superadmin/subjects/create',
        name: 'superadmin.subjects.create',
        component: () => import('@/modules/superadmin/pages/subjects/SubjectCreate.vue'),
        meta: {
            title: 'Registrar - Materia'
        }
    },
    {
        path: 'superadmin/subjects/edit/:id',
        name: 'superadmin.subjects.edit',
        component: () => import('@/modules/superadmin/pages/subjects/SubjectEdit.vue'),
        meta: {
            title: 'Actualizar - Materia'
        }
    },
    {
        path: 'superadmin/subjects/delete/:id',
        name: 'superadmin.subjects.delete',
        component: () => import('@/modules/superadmin/pages/subjects/SubjectDelete.vue'),
        meta: {
            title: 'Eliminar - Materia',
        },
    },
]
