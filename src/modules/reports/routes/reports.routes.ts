export default [
    // Reports
    {
        path: 'reports/reports',
        name: 'reports.reports',
        component: () => import('@/modules/reports/pages/ReportsPage.vue'),
        meta: { title: 'Reportes' },
    },
    {
        path: 'reports/reports/create',
        name: 'reports.reports.create',
        component: () => import('@/modules/reports/pages/report/ReportCreate.vue'),
        meta: { title: 'Crear Reporte' },
    },
    {
        path: 'reports/reports/:id/edit',
        name: 'reports.reports.edit',
        component: () => import('@/modules/reports/pages/report/ReportEdit.vue'),
        meta: { title: 'Editar Reporte' },
    },
    {
        path: 'reports/reports/:id/delete',
        name: 'reports.reports.delete',
        component: () => import('@/modules/reports/pages/report/ReportDelete.vue'),
        meta: { title: 'Eliminar Reporte' },
    },

    // DAOs
    {
        path: 'reports/daos',
        name: 'reports.daos',
        component: () => import('@/modules/reports/pages/DaosPage.vue'),
        meta: { title: 'Objetos de Acceso a Datos' },
    },
    {
        path: 'reports/daos/create',
        name: 'reports.daos.create',
        component: () => import('@/modules/reports/pages/dao/DaoCreate.vue'),
        meta: { title: 'Crear DAO' },
    },
    {
        path: 'reports/daos/:id',
        name: 'reports.daos.show',
        component: () => import('@/modules/reports/pages/dao/DaoShow.vue'),
        meta: { title: 'Detalle - DAO' },
    },
    {
        path: 'reports/daos/:id/edit',
        name: 'reports.daos.edit',
        component: () => import('@/modules/reports/pages/dao/DaoEdit.vue'),
        meta: { title: 'Editar DAO' },
    },
    {
        path: 'reports/daos/:id/delete',
        name: 'reports.daos.delete',
        component: () => import('@/modules/reports/pages/dao/DaoDelete.vue'),
        meta: { title: 'Eliminar DAO' },
    },
]
