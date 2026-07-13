/**
 * Wrapper de navegador: carga el logo (asset Vite), empaqueta el XLSX oficial
 * y dispara la descarga.
 */
import tecnmLogoUrl from '@/assets/images/logos/TecNM.png'
import { packInstrumentacionXlsx, type InstrumentacionExportData } from './instrumentacionXlsx'

async function fetchAsset(url: string): Promise<ArrayBuffer | null> {
    try {
        const res = await fetch(url)
        if (!res.ok) return null
        return await res.arrayBuffer()
    } catch {
        return null
    }
}

function sanitize(s: string): string {
    return s.replace(/[^\p{L}\p{N}._-]+/gu, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

export async function downloadInstrumentacionXlsx(data: InstrumentacionExportData): Promise<void> {
    const tecnm = await fetchAsset(tecnmLogoUrl)

    const blob = await packInstrumentacionXlsx(data, {
        tecnmLogo: tecnm ? { data: tecnm, extension: 'png' } : undefined,
    })

    const parts = ['Instrumentacion', data.context.subjectCode, data.context.groupName, data.context.periodName]
        .filter(Boolean).map((p) => sanitize(String(p)))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${parts.join('_')}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
}
