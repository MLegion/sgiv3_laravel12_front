import { defineStore } from 'pinia'
import router from '@/app/router'
import { getMenus } from './auth.service'
import { AUTH_API } from '@/shared/api'
import type { MenuItem } from '@/shared/types/menu'
import type {AuthUser} from "@/shared/types/user.ts";
import type {DashboardType} from "@/shared/types/dashboard.ts";


/**
 * ⚠️ TEMPORAL
 * Estos datos se eliminarán cuando exista backend real
 */
const mockUser: AuthUser = {
    id: 1,
    name: 'Mario Pym',
    email: 'admin@sgi.edu.mx'
}

const mockMenus: MenuItem[] = [
    {
        label: 'Dashboard',
        icon: 'HomeIcon',
        route: '/',
    },
    {
        label: 'Académico',
        icon: 'AcademicCapIcon',
        children: [
            {
                label: 'Colegios',
                icon: 'BuildingLibraryIcon',
                route: '/colleges',
            },
            {
                label: 'Carreras',
                icon: 'BookOpenIcon',
                route: '/careers',
            },
            {
                label: 'Planes de estudio',
                icon: 'ClipboardDocumentListIcon',
                route: '/study-plans',
            },
        ],
    },
    {
        label: 'Recursos Humanos',
        icon: 'UsersIcon',
        children: [
            {
                label: 'Empleados',
                icon: 'UserIcon',
                route: '/employees',
            },
            {
                label: 'Puestos',
                icon: 'BriefcaseIcon',
                route: '/job-positions',
            },
        ],
    },
    {
        label: 'Seguridad',
        icon: 'ShieldCheckIcon',
        children: [
            {
                label: 'Usuarios',
                icon: 'UserGroupIcon',
                route: '/users',
            },
            {
                label: 'Roles y permisos',
                icon: 'KeyIcon',
                route: '/roles',
            },
        ],
    },
]

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') as string | null,
        user: null as AuthUser | null,
        menus: [] as MenuItem[],
        dashboard: 'default' as DashboardType,
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
         * Hidrata el estado del usuario al refrescar la página
         * Se ejecuta SOLO desde el router guard
         */
        async hydrate() {
            if (this.hydrated) return

            /*
            if (!this.token) {
                this.hydrated = true
                return
            }

            try {
                const { data } = await getMenus()
                this.menus = data
            } catch (error) {
                this.logout()
            } finally {
                this.hydrated = true
            }
            */

            // 🔧 DEV ONLY – simular sesión
            if (!this.token) {
                this.token = 'dev-token'
                localStorage.setItem('token', this.token)
            }

            // ⛔ MOCK TEMPORAL
            this.user = mockUser
            this.menus = mockMenus
            this.hydrated = true
        },

        /**
         * Guarda el token después del login
         */
        login(token: string) {
            this.token = token
            localStorage.setItem('token', token)
        },

        clearSession() {
            this.token = null
            this.user = null
            this.menus = []
            this.hydrated = false

            localStorage.removeItem('token')
        },

        /**
         * Cierra sesión y limpia todo
         */
        logout() {
            router.push('/auth/logout')
        },
    },
})
