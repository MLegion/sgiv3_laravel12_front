import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/**
 * Parser que resuelve paths con puntos (ej: "docente.docente_nombre", "horario.totales.total").
 * El parser por defecto de docxtemplater trata el tag completo como una sola clave literal.
 */
function dotPathParser(tag: string) {
    return {
        get(scope: any): unknown {
            if (tag === '.') return scope
            const parts = tag.split('.')
            let cur: any = scope
            for (const p of parts) {
                if (cur == null || typeof cur !== 'object') return undefined
                cur = cur[p]
            }
            return cur
        },
    }
}

export class DocxTemplateError extends Error {
    public readonly details: Array<{ id: string; explanation: string; context?: unknown }>
    constructor(message: string, details: Array<{ id: string; explanation: string; context?: unknown }> = []) {
        super(message)
        this.name = 'DocxTemplateError'
        this.details = details
    }
}

function normalizeTemplateErrors(err: unknown): DocxTemplateError {
    const e = err as any
    const details = e?.properties?.errors?.map((x: any) => ({
        id:          x?.properties?.id ?? x?.id ?? 'unknown',
        explanation: x?.properties?.explanation ?? x?.message ?? String(x),
        context:     x?.properties?.context,
    })) ?? []

    const msg = details.length
        ? 'La plantilla contiene errores: ' + details.map(d => d.explanation).join('; ')
        : (e?.message ?? 'Error al procesar la plantilla')

    return new DocxTemplateError(msg, details)
}

export async function fillDocxTemplate(templateBlob: Blob, context: Record<string, unknown>): Promise<Blob> {
    const buffer = await templateBlob.arrayBuffer()
    const zip    = new PizZip(buffer)

    let doc: Docxtemplater
    try {
        doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks:    true,
            parser:        dotPathParser,
            nullGetter:    (part: any) => {
                // eslint-disable-next-line no-console
                console.warn('[docx] placeholder sin valor:', part?.value ?? part)
                return ''
            },
        })
    } catch (e) {
        throw normalizeTemplateErrors(e)
    }

    try {
        doc.render(context)
    } catch (e) {
        throw normalizeTemplateErrors(e)
    }

    return doc.getZip().generate({
        type:        'blob',
        mimeType:    DOCX_MIME,
        compression: 'DEFLATE',
    })
}
