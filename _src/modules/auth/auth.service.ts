import { api } from '@/shared/services/api'
import { AUTH_API } from '@/shared/api'
import type { MenuItem } from '@/shared/types/menu'
import type { LoginResponse, LoginPayload } from './types/types'

export async function loginAdminRequest(
    payload: LoginPayload
): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>(
        AUTH_API.superadminLogin,
        payload,
        {
            headers: {
                Accept: 'application/json',
            },
        }
    )

    return data
}

export async function loginRequest(
    payload: LoginPayload
): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>(
        AUTH_API.login,
        payload,
        {
            headers: {
                Accept: 'application/json',
            },
        }
    )

    return data
}

export function getMenus() {
    return api.get<MenuItem[]>(AUTH_API.menus)
}





