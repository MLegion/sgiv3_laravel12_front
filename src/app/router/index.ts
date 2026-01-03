import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guards'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // =========================
        // AUTH
        // =========================
        {
            path: '/auth/login',
            component: () => import('@/modules/auth/pages/UserLoginPage.vue'),
        },
        {
            path: '/auth/superadmin/login',
            component: () => import('@/modules/auth/pages/SuperadminLoginPage.vue'),
        },
        {
            path: '/auth/splash',
            component: () => import('@/modules/auth/pages/SplashPage.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/auth/logout',
            component: () => import('@/modules/auth/pages/LogoutSplashPage.vue'),
        },

        // =========================
        // SYSTEM PAGES
        // =========================
        {
            path: '/maintenance',
            component: () => import('@/app/pages/MaintenancePage.vue'),
        },
        {
            path: '/error',
            component: () => import('@/app/pages/ServerErrorPage.vue'),
        },

        // =========================
        // APP (LAYOUT)
        // =========================
        {
            path: '/',
            component: () => import('@/app/layouts/AdminLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    component: () => import('@/app/pages/DashboardPage.vue'),
                },

                // ⬇️ Rutas dummy para pruebas (puedes quitarlas después)
                {
                    path: 'colleges',
                    component: () => import('@/app/pages/PlaceholderPage.vue'),
                },
                {
                    path: 'careers',
                    component: () => import('@/app/pages/PlaceholderPage.vue'),
                },
                {
                    path: 'employees',
                    component: () => import('@/app/pages/PlaceholderPage.vue'),
                },
            ],
        },

        // =========================
        // 404 (SIEMPRE AL FINAL)
        // =========================
        {
            path: '/:pathMatch(.*)*',
            component: () => import('@/app/pages/NotFoundPage.vue'),
        },
    ],
})

router.beforeEach(authGuard)

export default router