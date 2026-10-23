export default [
    {
        path: 'calendar',
        name: 'calendar.index',
        component: () => import('@/modules/calendar/pages/CalendarPage.vue'),
        meta: { title: 'Calendario' },
    },
]
