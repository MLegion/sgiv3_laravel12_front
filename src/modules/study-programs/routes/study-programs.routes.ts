export default [
    {
        path: 'study-programs',
        name: 'study-programs.index',
        component: () => import('@/modules/study-programs/pages/StudyProgramsPage.vue'),
        meta: { title: 'Programas de estudio' },
    },
]
