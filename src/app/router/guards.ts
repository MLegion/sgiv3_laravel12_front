import { useAuthStore } from '@/modules/auth/auth.store.ts'

export async function authGuard(to: any) {
    const auth = useAuthStore()

    if (!auth.hydrated) {
        await auth.hydrate()
    }

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        return '/auth/login'
    }
}
