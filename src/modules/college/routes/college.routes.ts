export default [
    {
        path: 'college/users',
        name: 'college.users',
        component: () => import('@/modules/college/pages/CollegeUsersPage.vue'),
        meta: { title: 'Usuarios del College' },
    },
]
