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

/**
 * Respuesta del login primario cuando el usuario tiene 2FA activo: en lugar del
 * token llega un challenge que se canjea con el código TOTP en /auth/mfa/verify.
 */
export interface MfaChallengeResponse {
    mfa_required: true
    challenge: string
    expires_in: number
}

export type LoginResult = LoginResponse | MfaChallengeResponse

export function isMfaChallenge(r: LoginResult): r is MfaChallengeResponse {
    return (r as MfaChallengeResponse).mfa_required === true
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
    const { data } = await api.post<LoginResult>(
        API.AUTH_API.login,
        payload,
        { headers: { Accept: 'application/json' } },
    )
    return data
}

/** Canjea el challenge + código (TOTP o recuperación) por el token real. */
export async function verifyMfaRequest(payload: { challenge: string; code: string }): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>(
        '/api/v1/auth/mfa/verify',
        payload,
        { headers: { Accept: 'application/json' } },
    )
    return data
}
