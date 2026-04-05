import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useMenuStore} from "@/app/stores/menu.store";
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const PORTAL_PREFIX        = '/admissions/portal'
const VERIFY_EMAIL_ROUTE   = '/admissions/portal/verify-email'

export async function authGuard(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
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

    next()
}
