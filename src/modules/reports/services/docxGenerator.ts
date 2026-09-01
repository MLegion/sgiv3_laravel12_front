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
        ? 'La plantilla contiene errores: ' + details.map((d: { explanation: string }) => d.explanation).join('; ')
        : (e?.message ?? 'Error al procesar la plantilla')

    return new DocxTemplateError(msg, details)
}

/**
 * Une verticalmente (vMerge) las celdas consecutivas de una misma columna que
 * tengan el mismo valor, cuando el valor viene marcado con el sentinel `@@VM@@`
 * desde el DAO. La marca se retira; la primera fila del grupo queda con
 * vMerge="restart" y las siguientes con vMerge (continue) y sin texto.
 */
const VM_MARK = '@@VM@@'

// Solo el elemento de texto real <w:t> (no <w:tcW>, <w:tcPr>, etc.).
const W_T_RE = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g
function vmCellText(tc: string): string {
    const m = tc.match(W_T_RE) || []
    return m.map((t) => t.replace(/<[^>]+>/g, '')).join('')
}
function vmSetMerge(tc: string, val: 'restart' | 'continue'): string {
    const vm = val === 'restart' ? '<w:vMerge w:val="restart"/>' : '<w:vMerge/>'
    // OOXML exige el orden de hijos de tcPr: ...tcW, gridSpan, hMerge, vMerge, tcBorders...
    // Insertar vMerge justo después de gridSpan (si hay) o de tcW.
    if (/<w:gridSpan\b[^>]*\/>/.test(tc)) return tc.replace(/(<w:gridSpan\b[^>]*\/>)/, '$1' + vm)
    if (/<w:tcW\b[^>]*\/>/.test(tc)) return tc.replace(/(<w:tcW\b[^>]*\/>)/, '$1' + vm)
    if (/<w:tcPr>/.test(tc)) return tc.replace('<w:tcPr>', '<w:tcPr>' + vm)
    return tc.replace('<w:tc>', '<w:tc><w:tcPr>' + vm + '</w:tcPr>')
}
function vmStripMark(tc: string): string {
    return tc.split(VM_MARK).join('')
}
function vmBlankText(tc: string): string {
    return tc.replace(/(<w:t(?:\s[^>]*)?>)[\s\S]*?(<\/w:t>)/g, '$1$2')
}
function applyVerticalMerge(documentXml: string): string {
    return documentXml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, (tbl) => {
        const rows = tbl.match(/<w:tr\b[\s\S]*?<\/w:tr>/g)
        if (!rows) return tbl
        const parsed = rows.map((r) => ({ xml: r, cells: r.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || [] }))
        const numRows = parsed.length
        const maxCols = parsed.reduce((m, p) => Math.max(m, p.cells.length), 0)
        let changed = false
        for (let col = 0; col < maxCols; col++) {
            let r = 0
            while (r < numRows) {
                const cell = parsed[r].cells[col]
                if (!cell) { r++; continue }
                const txt = vmCellText(cell)
                if (!txt.startsWith(VM_MARK)) { r++; continue }
                const val = txt.slice(VM_MARK.length)
                let end = r
                while (end + 1 < numRows) {
                    const nc = parsed[end + 1].cells[col]
                    if (!nc) break
                    const nt = vmCellText(nc)
                    if (!nt.startsWith(VM_MARK) || nt.slice(VM_MARK.length) !== val) break
                    end++
                }
                changed = true
                parsed[r].cells[col] = vmSetMerge(vmStripMark(cell), 'restart')
                for (let k = r + 1; k <= end; k++) {
                    parsed[k].cells[col] = vmSetMerge(vmBlankText(vmStripMark(parsed[k].cells[col])), 'continue')
                }
                r = end + 1
            }
        }
        if (!changed) return tbl
        const firstTr = tbl.indexOf('<w:tr')
        const prefix = tbl.slice(0, firstTr)
        const newRows = parsed
            .map((p) => {
                const firstTc = p.xml.indexOf('<w:tc>')
                if (firstTc < 0) return p.xml
                return p.xml.slice(0, firstTc) + p.cells.join('') + '</w:tr>'
            })
            .join('')
        return prefix + newRows + '</w:tbl>'
    })
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

    // Post-proceso: une celdas verticales marcadas con @@VM@@ (p. ej. columna Rubro).
    const outZip = doc.getZip()
    const docXml = outZip.file('word/document.xml')?.asText()
    if (docXml && docXml.includes(VM_MARK)) {
        outZip.file('word/document.xml', applyVerticalMerge(docXml))
    }

    return outZip.generate({
        type:        'blob',
        mimeType:    DOCX_MIME,
        compression: 'DEFLATE',
    })
}
