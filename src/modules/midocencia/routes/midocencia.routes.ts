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
        path: 'midocencia/my-schedule',
        name: 'midocencia.my-schedule',
        component: () => import('@/modules/midocencia/pages/MyDischargeSchedulePage.vue'),
        meta: { title: 'Horario de Descarga' },
    },
    {
        path: 'midocencia/my-evidences',
        name: 'midocencia.my-evidences',
        component: () => import('@/modules/midocencia/pages/MyEvidencePage.vue'),
        meta: { title: 'Mis Evidencias' },
    },
    {
        path: 'midocencia/sections',
        name: 'midocencia.sections',
        component: () => import('@/modules/midocencia/pages/SectionEvidenceViewerPage.vue'),
        meta: { title: 'Evidencias por Sección' },
    },
    {
        path: 'midocencia/basicas',
        name: 'midocencia.basicas',
        component: () => import('@/modules/midocencia/pages/BasicasRosterPage.vue'),
        meta: { title: 'Padrón de Ciencias Básicas' },
    },
    {
        path: 'midocencia/basicas/approval',
        name: 'midocencia.basicas.approval',
        component: () => import('@/modules/midocencia/pages/BasicasApprovalPage.vue'),
        meta: { title: 'Ciencias Básicas — Aprobar Horario' },
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
