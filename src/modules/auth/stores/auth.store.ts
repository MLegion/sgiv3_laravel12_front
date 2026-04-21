import { defineStore } from 'pinia'
import router from '@/app/router'
import type { AuthUser } from "@/shared/types/user";
import type { DashboardType } from "@/shared/types/dashboard";
import { loginRequest } from '@/modules/auth/services/auth.service'
import { api } from '@/shared/services/api'
import { useMenuStore } from '@/app/stores/menu.store'

export type ProfileType = 'employee' | 'student' | 'applicant'

export interface ImpersonatorInfo {
    id: number
    name: string
    email: string
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') as string | null,
        user: null as AuthUser | null,
        dashboard: 'default' as DashboardType,
        mustChangePassword: false,
        hydrated: false,
        emailVerified: null as boolean | null, // null = no consultado aún
        profileType: null as ProfileType | null,

        // Impersonation state
        impersonatorToken: localStorage.getItem('impersonator_token') as string | null,
        impersonatorUser: null as AuthUser | null,
        impersonator: null as ImpersonatorInfo | null,
        impersonationExpiresAt: localStorage.getItem('impersonation_expires_at'),
    }),

    getters: {
        isAuthenticated(): boolean {
            return !!this.token
        },
        userName(state) : string {
            return state.user?.name ?? ''
        },
        isImpersonating(state): boolean {
            return !!state.impersonatorToken
        },
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
         * Login con Google OAuth (access_token emitido por GIS).
         * El backend valida que el email matchee el dominio Workspace del college.
         */
        async loginWithGoogle(payload: { accessToken: string; collegeId: number }) {
            const { data } = await api.post('/api/v1/auth/google', {
                access_token: payload.accessToken,
                college_id:   payload.collegeId,
            })

            this.token = data.access_token
            this.user  = data.user
            this.mustChangePassword = data.must_change_password ?? false

            localStorage.setItem('token', data.access_token)
            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('must_change_password', String(this.mustChangePassword))

            router.replace('/auth/splash')
        },
        /**
         * Hidrata el estado del usuario al refrescar la página
         * Se ejecuta SOLO desde el router guard
         */
        async hydrate() {
            if (this.hydrated) return

            // Limpieza proactiva: si la simulación tenía expires_at en el pasado,
            // cae automáticamente al token del impersonador (antes de que un 401
            // tenga que disparar el interceptor).
            const expiresAt = localStorage.getItem('impersonation_expires_at')
            if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
                const impToken = localStorage.getItem('impersonator_token')
                const impUser  = localStorage.getItem('impersonator_user')
                if (impToken && impUser) {
                    localStorage.setItem('token', impToken)
                    localStorage.setItem('user', impUser)
                    localStorage.setItem('must_change_password', 'false')
                }
                localStorage.removeItem('impersonator_token')
                localStorage.removeItem('impersonator_user')
                localStorage.removeItem('impersonator_info')
                localStorage.removeItem('impersonation_expires_at')
            }

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

                // Hidrata estado de impersonación si existe (aún vigente)
                const impToken = localStorage.getItem('impersonator_token')
                const impUser = localStorage.getItem('impersonator_user')
                const impInfo = localStorage.getItem('impersonator_info')
                if (impToken && impUser) {
                    this.impersonatorToken = impToken
                    this.impersonatorUser = JSON.parse(impUser)
                    this.impersonator = impInfo ? JSON.parse(impInfo) : null
                    this.impersonationExpiresAt = localStorage.getItem('impersonation_expires_at')
                }

                this.hydrated = true

                // Ping al backend para verificar que el token siga vivo.
                // Si el token actual está revocado/expirado, el interceptor 401
                // lo detecta y limpia la sesión (si hay impersonator_token vivo lo restaura).
                // Esto cierra el caso de "cerré la ventana y al reabrir el token
                // ya no sirve pero sigue en localStorage".
                api.get('/api/v1/auth/me').catch(() => { /* 401 manejado por interceptor */ })
            }
        },

        /**
         * Establece sesión directamente desde token (post-registro sin verificación)
         */
        loginWithToken(token: string, user: AuthUser) {
            this.token = token
            this.user  = user
            this.mustChangePassword = false

            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            localStorage.setItem('must_change_password', 'false')

            router.replace('/auth/splash')
        },

        /**
         * Inicia la simulación de un usuario.
         * Guarda el token actual del superadmin como `impersonator_*`
         * y cambia el token activo al emitido para el usuario objetivo.
         */
        async startImpersonation(payload: {
            userId: number
        }) {
            const { data } = await api.post(`/api/v1/superadmin/impersonate/${payload.userId}`)

            // Preservar sesión original — SOLO si no estábamos ya simulando
            // (evita pisar el token real del superadmin con el de una simulación previa)
            if (this.token && this.user && !this.impersonatorToken) {
                this.impersonatorToken = this.token
                this.impersonatorUser = this.user
                localStorage.setItem('impersonator_token', this.token)
                localStorage.setItem('impersonator_user', JSON.stringify(this.user))
            }
            if (data.impersonator) {
                this.impersonator = data.impersonator
                localStorage.setItem('impersonator_info', JSON.stringify(data.impersonator))
            }

            // Activar sesión impersonada
            this.token = data.access_token
            this.user = data.user
            this.mustChangePassword = false
            this.profileType = null
            this.impersonationExpiresAt = data.expires_at ?? null

            localStorage.setItem('token', data.access_token)
            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('must_change_password', 'false')
            if (data.expires_at) {
                localStorage.setItem('impersonation_expires_at', data.expires_at)
            }

            // Recarga menú y perfil con el nuevo token
            const menu = useMenuStore()
            await menu.reload()
            await this.loadProfileType()

            router.replace('/')
        },

        /**
         * Finaliza la simulación y restaura la sesión del superadmin.
         * Intenta revocar el token en el backend; aún si falla, restaura el estado.
         */
        async stopImpersonation() {
            try {
                await api.post('/api/v1/superadmin/impersonate/stop')
            } catch {
                // continuar con restauración
            }

            const impToken = this.impersonatorToken
            const impUser = this.impersonatorUser

            if (!impToken || !impUser) {
                this.clearSession()
                router.replace('/auth/login')
                return
            }

            this.token = impToken
            this.user = impUser
            this.mustChangePassword = false
            this.profileType = null
            this.impersonatorToken = null
            this.impersonatorUser = null
            this.impersonator = null
            this.impersonationExpiresAt = null

            localStorage.setItem('token', impToken)
            localStorage.setItem('user', JSON.stringify(impUser))
            localStorage.removeItem('impersonator_token')
            localStorage.removeItem('impersonator_user')
            localStorage.removeItem('impersonator_info')
            localStorage.removeItem('impersonation_expires_at')

            // Recarga menú y perfil con el token restaurado
            const menu = useMenuStore()
            await menu.reload()
            await this.loadProfileType()

            router.replace('/superadmin/impersonate')
        },

        /**
         * Carga (y cachea) el tipo de perfil del usuario autenticado.
         */
        async loadProfileType(): Promise<ProfileType | null> {
            if (this.profileType) return this.profileType
            if (!this.token) return null
            try {
                const { data } = await api.get('/api/v1/user/profile')
                this.profileType = data.type as ProfileType
                return this.profileType
            } catch {
                return null
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
            this.profileType = null
            this.impersonatorToken = null
            this.impersonatorUser = null
            this.impersonator = null
            this.impersonationExpiresAt = null

            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('must_change_password')
            localStorage.removeItem('logout')
            localStorage.removeItem('impersonator_token')
            localStorage.removeItem('impersonator_user')
            localStorage.removeItem('impersonator_info')
            localStorage.removeItem('impersonation_expires_at')
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
