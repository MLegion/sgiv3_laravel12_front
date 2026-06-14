export default [
    {
        path: 'profile',
        name: 'user.profile',
        component: () => import('@/modules/user/pages/MyProfilePage.vue'),
        meta: { title: 'Mi Perfil' },
    },
]
