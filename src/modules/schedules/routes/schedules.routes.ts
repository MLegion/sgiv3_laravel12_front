export default [
    {
        path: 'schedules/academic',
        name: 'schedules.academic',
        component: () => import('@/modules/schedules/pages/AcademicSchedulePage.vue'),
        meta: { title: 'Horarios Académicos' },
    },
    {
        path: 'schedules/group-preferred-places',
        name: 'schedules.group-preferred-places',
        component: () => import('@/modules/schedules/pages/GroupPreferredPlacesPage.vue'),
        meta: { title: 'Aulas Preferidas por Grupo' },
    },
]
