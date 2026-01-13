import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useMenuStore} from "@/app/stores/menu.store";
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

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
    // 1. Si la ruta requiere auth y no está autenticado -> Login
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        return next('/auth/login')
    }

    // 🔑 Autenticado pero NO pasó por splash
    if (auth.isAuthenticated && !isAuthRoute && !menuStore.loaded && to.path !== '/auth/splash') {
        sessionStorage.setItem('post_splash_redirect', to.fullPath)
        return next('/auth/splash')
    }

    next()
}
