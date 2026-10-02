import { api } from '@/shared/services/api'
import { apiUrl } from '@/shared/api/config'

/** Estado del onboarding para el guardián del router. */
export interface CollegeSetupStatus {
    applies: boolean
    completed: boolean
}

/** Información institucional del colegio para prellenar el asistente. */
export interface CollegeSetupInfo {
    college: {
        id: number
        name: string
        short_name: string | null
        address: string | null
        geo_settlement_id: number | null
        postal_code: string | null
        state: string | null
        municipality: string | null
        city: string | null
        colony: string | null
    }
    completed: boolean
}

export async function fetchSetupStatus(): Promise<CollegeSetupStatus> {
    const { data } = await api.get<CollegeSetupStatus>(apiUrl('/college/setup/status'))
    return data
}

export async function fetchSetup(): Promise<CollegeSetupInfo> {
    const { data } = await api.get<CollegeSetupInfo>(apiUrl('/college/setup'))
    return data
}

export async function updateSetupInfo(payload: {
    name?: string | null
    short_name?: string | null
    address: string
    geo_settlement_id: number
}): Promise<CollegeSetupInfo> {
    const { data } = await api.put<CollegeSetupInfo>(apiUrl('/college/setup/info'), payload)
    return data
}

export async function completeSetup(): Promise<{ completed: boolean }> {
    const { data } = await api.post<{ completed: boolean }>(apiUrl('/college/setup/complete'), {})
    return data
}
