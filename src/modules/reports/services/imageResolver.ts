import QRCode from 'qrcode'
import { api } from '@/shared/services/api'

/**
 * Pre-resuelve imágenes para el reporteador antes de rellenar la plantilla.
 * El módulo de imágenes de docxtemplater necesita los bytes de forma SÍNCRONA,
 * así que aquí convertimos (de forma asíncrona) los valores marcados del contexto
 * a data URLs base64.
 *
 * Convención de marcas en los valores devueltos por el DAO:
 *   - `qr:<url>`   → genera un código QR de <url> (si es relativo, se antepone el origin).
 *   - `img:<url>`  → descarga la imagen de <url> (vía el cliente autenticado).
 * Los valores vacíos o sin marca quedan intactos.
 */

// PNG transparente 1×1 (placeholder cuando no hay imagen).
const TRANSPARENT_PNG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

function absolute(url: string): string {
    if (/^https?:\/\//i.test(url)) return url
    return window.location.origin + (url.startsWith('/') ? url : '/' + url)
}

async function qrDataUrl(url: string): Promise<string> {
    try {
        return await QRCode.toDataURL(absolute(url), { width: 240, margin: 1 })
    } catch {
        return TRANSPARENT_PNG
    }
}

async function fetchImageDataUrl(url: string): Promise<string> {
    try {
        const res = await api.get(url, { responseType: 'blob' })
        const blob: Blob = res.data
        return await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(String(reader.result || TRANSPARENT_PNG))
            reader.onerror = () => resolve(TRANSPARENT_PNG)
            reader.readAsDataURL(blob)
        })
    } catch {
        return TRANSPARENT_PNG
    }
}

async function resolveValue(value: string): Promise<string> {
    if (value.startsWith('qr:')) {
        const payload = value.slice(3)
        return payload && payload !== '/verificar/' ? await qrDataUrl(payload) : TRANSPARENT_PNG
    }
    if (value.startsWith('img:')) {
        const payload = value.slice(4)
        return payload ? await fetchImageDataUrl(payload) : TRANSPARENT_PNG
    }
    return value
}

/** Recorre el contexto (objetos y arrays) y resuelve las marcas qr:/img: in-place. */
export async function resolveImages(context: Record<string, any>): Promise<void> {
    const tasks: Promise<void>[] = []

    const walk = (node: any) => {
        if (Array.isArray(node)) {
            node.forEach(walk)
        } else if (node && typeof node === 'object') {
            for (const key of Object.keys(node)) {
                const v = node[key]
                if (typeof v === 'string' && (v.startsWith('qr:') || v.startsWith('img:'))) {
                    tasks.push(resolveValue(v).then((resolved) => { node[key] = resolved }))
                } else if (v && typeof v === 'object') {
                    walk(v)
                }
            }
        }
    }

    walk(context)
    await Promise.all(tasks)
}
