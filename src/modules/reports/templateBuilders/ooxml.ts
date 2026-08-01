/**
 * Helpers para construir documentos OOXML (.docx) en el navegador.
 * Se usan para generar plantillas de reportes por configuración, de modo que
 * el "afinador visual" pueda reconstruir la plantilla en caliente y mostrarla
 * llena con docxtemplater + docx-preview sin ir y venir a Word.
 *
 * Los tamaños de fuente (sz) van en medios-puntos (half-points): pt * 2.
 * Los anchos van en twips (dxa): 1 pulgada = 1440 twips.
 */
import PizZip from 'pizzip'

export interface RunOpts { b?: boolean; i?: boolean; sz?: number; color?: string; font?: string }
export interface ParaOpts { align?: string; before?: number; after?: number }
export interface CellOpts { w?: number; span?: number; shade?: string; valign?: string }
export interface TableOpts { width?: number; borders?: boolean; cellMargin?: number }

const escXml = (s: unknown): string =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Crea el juego de helpers ligado a una familia tipográfica. */
export function createOoxml(fontFamily = 'Arial') {
    function run(text: unknown, opts: RunOpts = {}): string {
        const font = opts.font || fontFamily
        const rpr =
            `<w:rPr>` +
            (opts.b ? `<w:b/>` : ``) +
            (opts.i ? `<w:i/>` : ``) +
            `<w:sz w:val="${opts.sz || 18}"/><w:szCs w:val="${opts.sz || 18}"/>` +
            (opts.color ? `<w:color w:val="${opts.color}"/>` : ``) +
            `<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>` +
            `</w:rPr>`
        return `<w:r>${rpr}<w:t xml:space="preserve">${escXml(text)}</w:t></w:r>`
    }

    function para(runs: string | string[], opts: ParaOpts = {}): string {
        const ppr =
            `<w:pPr>` +
            (opts.align ? `<w:jc w:val="${opts.align}"/>` : ``) +
            `<w:spacing w:before="${opts.before ?? 10}" w:after="${opts.after ?? 10}" w:line="240" w:lineRule="auto"/>` +
            `</w:pPr>`
        return `<w:p>${ppr}${Array.isArray(runs) ? runs.join('') : runs}</w:p>`
    }

    function cell(bodyXml: string, opts: CellOpts = {}): string {
        const tcpr =
            `<w:tcPr>` +
            (opts.w ? `<w:tcW w:w="${opts.w}" w:type="dxa"/>` : `<w:tcW w:w="0" w:type="auto"/>`) +
            (opts.span ? `<w:gridSpan w:val="${opts.span}"/>` : ``) +
            (opts.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${opts.shade}"/>` : ``) +
            `<w:vAlign w:val="${opts.valign || 'center'}"/>` +
            `</w:tcPr>`
        return `<w:tc>${tcpr}${bodyXml}</w:tc>`
    }

    /** Celda de texto simple. popts.run = estilo del run; el resto = estilo de párrafo. */
    function tcell(text: unknown, popts: ParaOpts & { run?: RunOpts } = {}, copts: CellOpts = {}): string {
        const { run: runOpts, ...pOpts } = popts
        return cell(para([run(text, runOpts || {})], pOpts), copts)
    }

    const row = (cells: string[]): string => `<w:tr>${cells.join('')}</w:tr>`

    function table(grid: number[], rows: string[], opts: TableOpts = {}): string {
        const sides = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
        const borders = opts.borders === false
            ? `<w:tblBorders>${sides.map((s) => `<w:${s} w:val="none" w:sz="0" w:space="0" w:color="auto"/>`).join('')}</w:tblBorders>`
            : `<w:tblBorders>${sides.map((s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join('')}</w:tblBorders>`
        const m = opts.cellMargin ?? 60
        const tblGrid = `<w:tblGrid>${grid.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>`
        return (
            `<w:tbl><w:tblPr>` +
            `<w:tblW w:w="${opts.width ?? grid.reduce((a, b) => a + b, 0)}" w:type="dxa"/>` +
            `<w:tblLayout w:type="fixed"/>` +  // ancho fijo: el texto largo envuelve, no ensancha
            borders +
            `<w:tblCellMar><w:left w:w="${m}" w:type="dxa"/><w:right w:w="${m}" w:type="dxa"/></w:tblCellMar>` +
            `</w:tblPr>${tblGrid}${rows.join('')}</w:tbl>`
        )
    }

    return { run, para, cell, tcell, row, table }
}

/** Empaqueta el cuerpo del documento en un .docx mínimo y devuelve los bytes. */
export function packDocx(bodyXml: string, sectPrXml: string): ArrayBuffer {
    const documentXml =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<w:body>${bodyXml}${sectPrXml}</w:body></w:document>`

    const contentTypes =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
        `</Types>`
    const rels =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
        `</Relationships>`

    const zip = new PizZip()
    zip.file('[Content_Types].xml', contentTypes)
    zip.file('_rels/.rels', rels)
    zip.file('word/document.xml', documentXml)
    return zip.generate({ type: 'arraybuffer', compression: 'DEFLATE' })
}

/** sectPr estándar carta con márgenes; page dims en twips. */
export function letterSectPr(): string {
    return (
        `<w:sectPr>` +
        `<w:pgSz w:w="12240" w:h="15840"/>` +
        `<w:pgMar w:top="720" w:right="1080" w:bottom="720" w:left="1080" w:header="360" w:footer="360" w:gutter="0"/>` +
        `</w:sectPr>`
    )
}
