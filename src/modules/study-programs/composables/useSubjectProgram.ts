import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

/**
 * Abre el programa de estudio de una materia en una pestaña nueva.
 * - Copia local: se descarga vía endpoint autenticado (Bearer) y se abre como blob,
 *   porque el SPA no manda el token en un window.open directo.
 * - Enlace externo: se abre tal cual.
 */
export async function openSubjectProgram(
    subjectId: number,
    isLocal: boolean,
    externalUrl?: string | null,
): Promise<void> {
    if (isLocal) {
        const res = await api.get(API.STUDY_PROGRAMS_API.subjectLinks.programFile(subjectId), {
            responseType: 'blob',
        })
        const url = URL.createObjectURL(res.data as Blob)
        window.open(url, '_blank')
        // El navegador retiene el blob mientras la pestaña lo use; lo liberamos luego.
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
        return
    }

    if (externalUrl) {
        window.open(externalUrl, '_blank', 'noopener')
    }
}
