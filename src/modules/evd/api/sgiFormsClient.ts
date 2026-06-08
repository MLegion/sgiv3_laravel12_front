import axios, { type AxiosInstance } from 'axios'

/**
 * Cliente para hablar DIRECTAMENTE con el API de sgi_forms desde el navegador,
 * autenticado con el JWT EVD (sso_token) como Bearer. Es una instancia axios
 * APARTE de la de sgiv3 (`@/shared/services/api`), que inyecta el token de
 * sesión de sgiv3 en cada request — aquí necesitamos el sso_token, no ese.
 *
 * Permite embeber el cuestionario de EVD dentro del layout de sgiv3 sin iframe.
 */

export interface AttemptStartResult {
    attempt_id: number
    reused: boolean
    form: { id: number; slug: string; title: string }
}

export interface SgiFormsAttemptClient {
    startWithContext: (formSlug: string) => Promise<AttemptStartResult>
    show: (attemptId: number) => Promise<any>
    saveAnswers: (
        attemptId: number,
        answers: Array<{
            question_id: number
            option_id?: number | null
            selected_option_ids?: number[] | null
            text?: string | null
            scalar?: number | null
        }>,
    ) => Promise<any>
    finish: (attemptId: number) => Promise<any>
}

export function createSgiFormsClient(baseUrl: string, token: string): SgiFormsAttemptClient {
    const http: AxiosInstance = axios.create({
        baseURL: `${baseUrl.replace(/\/$/, '')}/api/v1/forms`,
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    })

    return {
        startWithContext: async (formSlug) =>
            (await http.post('/attempts/start-with-context', { form_slug: formSlug })).data,
        show: async (attemptId) => (await http.get(`/attempts/${attemptId}`)).data,
        saveAnswers: async (attemptId, answers) =>
            (await http.post(`/attempts/${attemptId}/answers`, { answers })).data,
        finish: async (attemptId) => (await http.post(`/attempts/${attemptId}/finish`)).data,
    }
}
