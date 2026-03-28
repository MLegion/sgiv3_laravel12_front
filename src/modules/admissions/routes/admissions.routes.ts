export default [
    // Origin Schools
    {
        path: 'admissions/origin-schools',
        name: 'admissions.origin-schools',
        component: () => import('@/modules/admissions/pages/OriginSchoolsPage.vue'),
        meta: { title: 'Escuelas de Procedencia' },
    },
    {
        path: 'admissions/origin-schools/create',
        name: 'admissions.origin-schools.create',
        component: () => import('@/modules/admissions/pages/origin-school/OriginSchoolCreate.vue'),
        meta: { title: 'Registrar - Escuela de Procedencia' },
    },
    {
        path: 'admissions/origin-schools/:id',
        name: 'admissions.origin-schools.show',
        component: () => import('@/modules/admissions/pages/origin-school/OriginSchoolShow.vue'),
        meta: { title: 'Detalle - Escuela de Procedencia' },
    },
    {
        path: 'admissions/origin-schools/:id/edit',
        name: 'admissions.origin-schools.edit',
        component: () => import('@/modules/admissions/pages/origin-school/OriginSchoolEdit.vue'),
        meta: { title: 'Editar - Escuela de Procedencia' },
    },
    {
        path: 'admissions/origin-schools/:id/delete',
        name: 'admissions.origin-schools.delete',
        component: () => import('@/modules/admissions/pages/origin-school/OriginSchoolDelete.vue'),
        meta: { title: 'Eliminar - Escuela de Procedencia' },
    },
]
