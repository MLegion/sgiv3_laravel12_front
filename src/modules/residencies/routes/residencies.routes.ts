export default [
    // ── Residente ─────────────────────────────────────────────────────
    {
        path: 'residencies/me',
        name: 'residencies.me',
        component: () => import('@/modules/residencies/pages/MyResidencyPage.vue'),
        meta: { title: 'Mi Residencia' },
    },

    // ── Asesor de residencia ──────────────────────────────────────────
    {
        path: 'residencies/my-advisees',
        name: 'residencies.my-advisees',
        component: () => import('@/modules/residencies/pages/AdvisorResidentsPage.vue'),
        meta: { title: 'Mis Residentes' },
    },

    // ── Coordinador / Jefe de carrera ─────────────────────────────────
    {
        path: 'residencies/list',
        name: 'residencies.list',
        component: () => import('@/modules/residencies/pages/ResidenciesListPage.vue'),
        meta: { title: 'Residentes' },
    },
    {
        path: 'residencies/list/:id',
        name: 'residencies.detail',
        component: () => import('@/modules/residencies/pages/ResidencyDetailPage.vue'),
        meta: { title: 'Detalle de Residencia' },
        props: true,
    },
    {
        path: 'residencies/companies',
        name: 'residencies.companies',
        component: () => import('@/modules/residencies/pages/CompaniesValidationPage.vue'),
        meta: { title: 'Empresas' },
    },
    {
        path: 'residencies/projects',
        name: 'residencies.projects',
        component: () => import('@/modules/residencies/pages/ProjectBankPage.vue'),
        meta: { title: 'Banco de Proyectos' },
    },
    {
        path: 'residencies/statistics',
        name: 'residencies.statistics',
        component: () => import('@/modules/residencies/pages/ResidencyStatisticsPage.vue'),
        meta: { title: 'Estadísticas de Residencias' },
    },
    {
        path: 'residencies/legacy',
        name: 'residencies.legacy',
        component: () => import('@/modules/residencies/pages/LegacyResidenciesPage.vue'),
        meta: { title: 'Histórico de Residencias' },
    },
    {
        path: 'residencies/requirements',
        name: 'residencies.requirements',
        component: () => import('@/modules/residencies/pages/RequirementSetsPage.vue'),
        meta: { title: 'Requisitos de Documentos' },
    },
    {
        path: 'residencies/personnel-config',
        name: 'residencies.personnel-config',
        component: () => import('@/modules/residencies/pages/PersonnelConfigPage.vue'),
        meta: { title: 'Configuración de Personal' },
    },
]
