export default [
    {
        path: 'midocencia/rubric',
        name: 'midocencia.rubric',
        component: () => import('@/modules/midocencia/pages/RubricPage.vue'),
        meta: { title: 'Rúbrica de Función Académica' },
    },
    {
        path: 'midocencia/rubric/:id/edit',
        name: 'midocencia.rubric.edit',
        component: () => import('@/modules/midocencia/pages/RubricEditPage.vue'),
        meta: { title: 'Editar Rúbrica' },
    },
    {
        path: 'midocencia/my-distribution',
        name: 'midocencia.my-distribution',
        component: () => import('@/modules/midocencia/pages/MyDistributionPage.vue'),
        meta: { title: 'Mi Docencia' },
    },
    {
        path: 'midocencia/approval',
        name: 'midocencia.approval',
        component: () => import('@/modules/midocencia/pages/DistributionApprovalPage.vue'),
        meta: { title: 'Aprobar Distribución' },
    },
    {
        path: 'midocencia/plaza',
        name: 'midocencia.plaza',
        component: () => import('@/modules/midocencia/pages/PlazaPage.vue'),
        meta: { title: 'Horas de Plaza' },
    },
]
