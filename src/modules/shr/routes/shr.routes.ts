export default [
    //###################################################################################
    //# ORGANIGRAMA DE TRABAJO                                                          #
    //###################################################################################
    {
        path: 'shr/organizationchart',
        name: 'shr.humanresources.organizationchart',
        component: () => import('@/modules/shr/pages/OrganizationChartPage.vue'),
        meta: {
            title: 'Organigrama de Trabajo'
        }
    },
    //###################################################################################
    //# AREA DE TRABAJO                                                               #
    //###################################################################################
    {
        path: 'shr/work-areas',
        name: 'shr.humanresources.workareas',
        component: () => import('@/modules/shr/pages/WorkAreasPage.vue'),
        meta: {
            title: 'Áreas de Trabajo'
        }
    },
    {
        path: 'shr/work-areas/show/:id',
        name: 'shr.humanresources.workareas.show',
        component: () => import('@/modules/shr/pages/workareas/WorkAreaShow.vue'),
        meta: {
            title: 'Información - Área de Trabajo'
        }
    },
    {
        path: 'shr/work-areas/create',
        name: 'shr.humanresources.workareas.create',
        component: () => import('@/modules/shr/pages/workareas/WorkAreaCreate.vue'),
        meta: {
            title: 'Registrar - Área de Trabajo'
        }
    },
    {
        path: 'shr/work-areas/edit/:id',
        name: 'shr.humanresources.workareas.edit',
        component: () => import('@/modules/shr/pages/workareas/WorkAreaEdit.vue'),
        meta: {
            title: 'Actualizar - Área de Trabajo'
        }
    },
    {
        path: 'shr/work-areas/delete/:id',
        name: 'shr.humanresources.workareas.delete',
        component: () => import('@/modules/shr/pages/workareas/WorkAreaDelete.vue'),
        meta: {
            title: 'Eliminar - Área de Trabajo',
        },
    },
    //###################################################################################
    //# PUESTO DE TRABAJO                                                               #
    //###################################################################################
    {
        path: 'shr/job-positions',
        name: 'shr.humanresources.jobpositions',
        component: () => import('@/modules/shr/pages/JobPositionsPage.vue'),
        meta: {
            title: 'Puestos de Trabajo'
        }
    },
    {
        path: 'shr/job-positions/show/:id',
        name: 'shr.humanresources.jobpositions.show',
        component: () => import('@/modules/shr/pages/jobpositions/JobPositionShow.vue'),
        meta: {
            title: 'Información - Puesto de Trabajo'
        }
    },
    {
        path: 'shr/job-positions/create',
        name: 'shr.humanresources.jobpositions.create',
        component: () => import('@/modules/shr/pages/jobpositions/JobPositionCreate.vue'),
        meta: {
            title: 'Registrar - Puesto de Trabajo'
        }
    },
    {
        path: 'shr/job-positions/edit/:id',
        name: 'shr.humanresources.jobpositions.edit',
        component: () => import('@/modules/shr/pages/jobpositions/JobPositionEdit.vue'),
        meta: {
            title: 'Actualizar - Puesto de Trabajo'
        }
    },
    {
        path: 'shr/job-positions/delete/:id',
        name: 'shr.humanresources.jobpositions.delete',
        component: () => import('@/modules/shr/pages/jobpositions/JobPositionDelete.vue'),
        meta: {
            title: 'Eliminar - Puesto de Trabajo',
        },
    },
    //###################################################################################
    //# EMPLEADOS                                                                       #
    //###################################################################################
    {
        path: 'shr/employees',
        name: 'shr.humanresources.employees',
        component: () => import('@/modules/shr/pages/EmployeesPage.vue'),
        meta: {
            title: 'Empleados'
        }
    },
    {
        path: 'shr/employees/show/:id',
        name: 'shr.humanresources.employees.show',
        component: () => import('@/modules/shr/pages/employees/EmployeeShow.vue'),
        meta: {
            title: 'Información - Empleado'
        }
    },
    {
        path: 'shr/employees/create',
        name: 'shr.humanresources.employees.create',
        component: () => import('@/modules/shr/pages/employees/EmployeeCreate.vue'),
        meta: {
            title: 'Registrar - Empleado'
        }
    },
    {
        path: 'shr/employees/edit/:id',
        name: 'shr.humanresources.employees.edit',
        component: () => import('@/modules/shr/pages/employees/EmployeeEdit.vue'),
        meta: {
            title: 'Actualizar - Empleado'
        }
    },
    {
        path: 'shr/employees/delete/:id',
        name: 'shr.humanresources.employees.delete',
        component: () => import('@/modules/shr/pages/employees/EmployeeDelete.vue'),
        meta: {
            title: 'Eliminar - Empleado',
        },
    },
    {
        path: 'shr/employees/history/:id',
        name: 'shr.humanresources.employees.history',
        component: () => import('@/modules/shr/pages/employees/EmployeeHistory.vue'),
        meta: {
            title: 'Historial laboral del empleado',
        },
    }
]
