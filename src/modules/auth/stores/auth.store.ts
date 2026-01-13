import { defineStore } from 'pinia'
import router from '@/app/router'
import type { AuthUser } from "@/shared/types/user";
import type { DashboardType } from "@/shared/types/dashboard";
import { loginRequest } from '@/modules/auth/services/auth.service'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') as string | null,
        user: null as AuthUser | null,
        dashboard: 'default' as DashboardType,
        mustChangePassword: false,
        hydrated: false,
    }),

    getters: {
        isAuthenticated(): boolean {
            return !!this.token
        },
        userName(state) : string {
            return state.user?.name ?? ''
        }
    },

    actions: {
        /**
         * Login REAL contra backend
         */
        async login(payload: { email: string; password: string, collegeId: number, rememberMe: boolean }) {
            const response = await loginRequest(payload)

            this.token = response.access_token
            this.user = response.user
            this.mustChangePassword = response.must_change_password

            localStorage.setItem('token', response.access_token)
            localStorage.setItem('user', JSON.stringify(response.user))
            localStorage.setItem(
                'must_change_password',
                String(response.must_change_password)
            )

            router.replace('/auth/splash')
        },
        /**
         * Hidrata el estado del usuario al refrescar la página
         * Se ejecuta SOLO desde el router guard
         */
        async hydrate() {
            if (this.hydrated) return

            const storedUser = localStorage.getItem('user')
            const storeToken = localStorage.getItem('token')
            const mustChange = localStorage.getItem('must_change_password')

            if (!storeToken) {
                this.hydrated = true
                return
            }


            if (storedUser && storeToken) {
                this.user = JSON.parse(storedUser)
                this.token = storeToken
                this.mustChangePassword = mustChange === 'true'

                this.hydrated = true
            }
        },

        /**
         * Limpia TODO el estado de sesión
         */
        clearSession() {
            this.token = null
            this.user = null
            this.dashboard = 'default'
            this.mustChangePassword = false
            this.hydrated = false

            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('must_change_password')
            localStorage.removeItem('logout')
        },

        /**
         * Logout formal
         */
        logout() {
            this.clearSession()
            router.replace('/auth/logout')
        },
    },
})
