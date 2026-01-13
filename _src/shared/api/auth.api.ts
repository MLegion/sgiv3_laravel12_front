import { apiUrl, setUrl } from './config'

export const AUTH_API = {
    login: apiUrl('/auth/login'),
    superadminLogin: apiUrl('/auth/admin/login'),
    colleges: apiUrl('/colleges.json'),
    logout: apiUrl('/auth/logout'),
}
