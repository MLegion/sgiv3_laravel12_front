export default [
    {
        path: 'shr/work-areas',
        name: 'shr.humanresources.workareas',
        component: () => import('@/modules/shr/pages/WorkAreasPage.vue'),
        meta: {
            title: 'Áreas de Trabajo'
        }
    },
    {
        path: 'shr/job-positions',
        name: 'shr.humanresources.jobpositions',
        component: () => import('@/modules/shr/pages/JobPositionsView.vue'),
        meta: {
            title: 'Puestos de Trabajo'
        }
    },
    {
        path: 'shr/employees',
        name: 'shr.humanresources.employees',
        component: () => import('@/modules/shr/pages/EmployeesPage.vue'),
        meta: {
            title: 'Empleados'
        }
    },
]
