import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guards'
import { baseProtectedRoutes, basePublicRoutes } from './base.routes'
import moduleRoutes from './module.routes'
import authRoutes from '@/modules/auth/auth.routes'

/**
 * La configuración del router se divide en tres capas:
 * 1. Rutas de Autenticación (Layout Splash)
 * 2. Rutas Protegidas (Layout App + Auto-discovery)
 * 3. Rutas Públicas (Mantenimiento, Errores)
 */
const router = createRouter({
    history: createWebHistory(),
    routes: [
        // 🔓 AUTH / SPLASH: Pantallas de acceso y carga inicial
        {
            path: '/auth',
            component: () => import('@/app/layouts/SplashLayout.vue'),
            children: authRoutes,
        },

        // 🎓 PORTAL DE ASPIRANTES
        {
            path: '/inscripciones',
            component: () => import('@/app/layouts/SplashLayout.vue'),
            children: [
                {
                    path: '',
                    component: () => import('@/modules/admissions/pages/InscripcionesPage.vue'),
                    meta: { title: 'Portal de Aspirantes' },
                },
            ],
        },

        // 🔐 APP: El corazón del sistema bajo AppLayout
        {
            path: '/',
            component: () => import('@/app/layouts/AppLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                ...baseProtectedRoutes,
                ...moduleRoutes,
            ],
        },

        // 🌍 RUTAS PÚBLICAS Y DE ERROR
        ...basePublicRoutes,

        // 404: Captura cualquier ruta no definida
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            component: () => import('@/app/pages/NotFoundPage.vue'),
        },
    ],
    // Mejora: Control de scroll automático al navegar
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition
        return { top: 0 }
    }
})

// Aplicar el guardián de navegación para hidratación y seguridad
router.beforeEach(authGuard)

export default router
