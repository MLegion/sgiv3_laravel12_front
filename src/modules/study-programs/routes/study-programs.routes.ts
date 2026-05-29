export default [
    {
        path: 'study-programs',
        name: 'study-programs.index',
        component: () => import('@/modules/study-programs/pages/StudyProgramsPage.vue'),
        meta: { title: 'Programas de estudio' },
    },
    {
        path: 'study-programs/links',
        name: 'study-programs.links',
        component: () => import('@/modules/study-programs/pages/SubjectProgramLinksPage.vue'),
        meta: { title: 'Enlaces de programas' },
    },
    {
        path: 'study-programs/create',
        name: 'study-programs.create',
        component: () => import('@/modules/study-programs/pages/StudyProgramForm.vue'),
        meta: { title: 'Nuevo programa de estudio' },
    },
    {
        path: 'study-programs/:id/edit',
        name: 'study-programs.edit',
        component: () => import('@/modules/study-programs/pages/StudyProgramForm.vue'),
        meta: { title: 'Editar programa de estudio' },
    },
]
