export default [
    {
        path: 'college/users',
        name: 'college.users',
        component: () => import('@/modules/college/pages/CollegeUsersPage.vue'),
        meta: { title: 'Usuarios del College' },
    },
    {
        path: 'college/roles',
        name: 'college.roles',
        component: () => import('@/modules/college/pages/RolesMenusPage.vue'),
        meta: { title: 'Roles y sus menús' },
    },
    {
        path: 'college/branding',
        name: 'college.branding',
        component: () => import('@/modules/college/pages/BrandingPage.vue'),
        meta: { title: 'Imagen del Colegio' },
    },
]
