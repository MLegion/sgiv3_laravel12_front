import { defineStore } from 'pinia'
import router from '@/app/router'
import { AUTH_API } from '@/shared/api'
import type { MenuItem } from '@/shared/types/menu'
import type { AuthUser } from "@/shared/types/user.ts";
import type { DashboardType } from "@/shared/types/dashboard.ts";
import { loginRequest } from './auth.service'
import { useMenuStore} from "@/modules/user/menu.store.ts";

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


            if (!this.token) {
                this.hydrated = true
                return
            }

            const storedUser = localStorage.getItem('user')
            const storeToken = localStorage.getItem('token')
            const mustChange = localStorage.getItem('must_change_password')

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
            this.menus = []
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
