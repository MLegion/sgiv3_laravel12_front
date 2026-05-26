export default [
    {
        path: 'college/users',
        name: 'college.users',
        component: () => import('@/modules/college/pages/CollegeUsersPage.vue'),
        meta: { title: 'Usuarios del College' },
    },
    {
        path: 'college/branding',
        name: 'college.branding',
        component: () => import('@/modules/college/pages/BrandingPage.vue'),
        meta: { title: 'Imagen del Colegio' },
    },
]
