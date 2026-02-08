export default [
    {
        path: 'login',
        component: () => import('@/modules/auth/pages/UserLoginPage.vue'),
        meta: { title: 'Ingresar' }
    },
    {
        path: 'admin/login',
        component: () => import('@/modules/auth/pages/SuperadminLoginPage.vue'),
        meta: { title: 'Ingresar admin' }
    },
    {
        path: 'splash',
        component: () => import('@/modules/auth/pages/SplashPage.vue'),
        meta: { title: 'Pantalla de carga' }
    },
    {
        path: 'logout',
        component: () => import('@/modules/auth/pages/LogoutSplashPage.vue'),
        meta: { title: 'Salir' }
    },
]
