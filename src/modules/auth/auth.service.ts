import { api } from '@/shared/services/api'
import { AUTH_API } from '@/shared/api'
import type { MenuItem } from '@/shared/types/menu'

export const loginSuperadmin = (username: string, password: string) =>
    api.post(AUTH_API.superadminLogin, { username, password })

export const loginUser = (collegeId: string, username: string, password: string) =>
    api.post(AUTH_API.login, { collegeId, username, password })

export function getMenus() {
    return api.get<MenuItem[]>(AUTH_API.menus)
}