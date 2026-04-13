export default [
    {
        path: 'schedules/academic',
        name: 'schedules.academic',
        component: () => import('@/modules/schedules/pages/AcademicSchedulePage.vue'),
        meta: { title: 'Horarios Académicos' },
    },
]
