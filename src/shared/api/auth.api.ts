import { apiUrl } from './config'

export const AUTH_API = {
    login: apiUrl('/auth/login'),
    superadminLogin: apiUrl('/auth/superadmin/login'),
    menus: apiUrl('/auth/menus.json'),
    logout: apiUrl('/auth/logout'),
}
