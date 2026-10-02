import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useMenuStore} from "@/app/stores/menu.store";
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const PORTAL_PREFIX        = '/admissions/portal'
const VERIFY_EMAIL_ROUTE   = '/admissions/portal/verify-email'
const ONBOARDING_ROUTE     = '/college/onboarding'

export async function authGuard(
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
) {
    const auth = useAuthStore()
    const menuStore = useMenuStore()

    if (!auth.hydrated && auth.token) {
        await auth.hydrate()
    }

    const isAuthRoute = to.path.startsWith('/auth')

    // 1. Si la ruta requiere auth y no está autenticado → Login
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        return next('/auth/login')
    }

    // 2. Autenticado pero NO pasó por splash
    if (auth.isAuthenticated && !isAuthRoute && !menuStore.loaded && to.path !== '/auth/splash') {
        sessionStorage.setItem('post_splash_redirect', to.fullPath)
        return next('/auth/splash')
    }

    // 3. Si el email ya fue marcado como no verificado, bloquear cualquier ruta protegida
    if (
        auth.isAuthenticated &&
        auth.emailVerified === false &&
        to.path !== VERIFY_EMAIL_ROUTE &&
        !isAuthRoute
    ) {
        return next(VERIFY_EMAIL_ROUTE)
    }

    // 4. Verificación de email para rutas del portal (consulta lazy, solo si no se ha hecho antes)
    if (
        auth.isAuthenticated &&
        to.path.startsWith(PORTAL_PREFIX) &&
        to.path !== VERIFY_EMAIL_ROUTE &&
        auth.emailVerified === null
    ) {
        try {
            const { data } = await api.get(API.ADMISSIONS_API.portal.emailStatus)
            auth.emailVerified = data.emailVerified || !data.requiresVerification
        } catch {
            auth.emailVerified = true
        }

        if (auth.emailVerified === false) {
            return next(VERIFY_EMAIL_ROUTE)
        }
    }

    // 5. Si ya verificó y está en la pantalla de verificación, redirigir al portal
    if (
        auth.isAuthenticated &&
        to.path === VERIFY_EMAIL_ROUTE &&
        auth.emailVerified === true
    ) {
        return next('/admissions/portal/personal')
    }

    // 6. Onboarding del colegio (bloqueante): un COLLEGE_ADMIN cuyo colegio no
    // tiene su información institucional es forzado al asistente y no puede salir
    // hasta completarlo. Se ignora en rutas de auth y del portal de aspirantes.
    if (
        auth.isAuthenticated &&
        !isAuthRoute &&
        !to.path.startsWith(PORTAL_PREFIX)
    ) {
        const setup = await auth.loadCollegeSetup()

        if (setup.applies && !setup.completed && to.path !== ONBOARDING_ROUTE) {
            return next(ONBOARDING_ROUTE)
        }
        // Si ya no aplica o ya está completo, nadie se queda atrapado en el asistente.
        if ((!setup.applies || setup.completed) && to.path === ONBOARDING_ROUTE) {
            return next('/')
        }
    }

    next()
}
