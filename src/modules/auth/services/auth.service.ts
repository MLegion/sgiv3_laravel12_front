import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { AuthUser } from '@/shared/types/user'

export interface LoginPayload {
    email: string
    password: string
    collegeId?: number | null
    rememberMe?: boolean
}

export interface LoginResponse {
    access_token: string
    user: AuthUser
    must_change_password: boolean
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>(
        API.AUTH_API.login,
        payload,
        { headers: { Accept: 'application/json' } },
    )
    return data
}
