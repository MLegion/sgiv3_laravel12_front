import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

/** Descarga el HTML del documento (con auth) y lo abre en una pestaña para imprimir. */
export async function openDocument(emissionId: number | string): Promise<void> {
    const D = API.SERVICE_DESK_API
    const { data } = await api.get(D.document(emissionId), { responseType: 'text' })
    const blob = new Blob([data], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
}
