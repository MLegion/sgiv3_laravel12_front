/**
 * Exportación a PDF usando pdfmake.
 * Convierte el doc TipTap ya renderizado al formato de definición de pdfmake.
 */
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces'
import type { TipTapDoc, TipTapNode } from './templateEngine'
import type { PageConfig } from '@/modules/reports/types/report.type'

// Registrar fuentes por defecto
pdfMake.vfs = pdfFonts.vfs

const PAGE_SIZES_PT: Record<string, [number, number]> = {
    A4:     [595.28, 841.89],
    Letter: [612,    792   ],
    Legal:  [612,    1008  ],
}

function mmToPt(mm: number): number { return mm * 2.8346 }

// Ancho usable de la página actual (en pt) — se setea al inicio de
// buildPdfDefinition y lo usa buildColumnWidths para escalar los colwidths
// proporcionalmente al ancho real de la página (igual que el editor con
// `table { width: 100% }`).
let currentUsableWidthPt = 0

/**
 * Construye la definición de documento pdfmake desde el TipTap doc.
 * Extraído de exportToPdf para poder compartirlo con previewPdf.
 */
function buildPdfDefinition(
    doc:       TipTapDoc,
    pageConfig?: PageConfig,
    header?:   TipTapDoc,
    footer?:   TipTapDoc,
): TDocumentDefinitions {
    const cfg = pageConfig
    const size = PAGE_SIZES_PT[cfg?.size ?? 'Letter'] ?? PAGE_SIZES_PT['Letter']
    const portrait = (cfg?.orientation ?? 'portrait') === 'portrait'
    const pageSize: [number, number] = portrait ? size : [size[1], size[0]]
    const m = cfg?.margins ?? { top: 25, right: 20, bottom: 25, left: 20 }
    currentUsableWidthPt = pageSize[0] - mmToPt(m.left) - mmToPt(m.right)
    const content: Content[] = (doc.content ?? []).flatMap(convertNode)

    return {
        content,
        pageSize:    { width: pageSize[0], height: pageSize[1] },
        pageMargins: [mmToPt(m.left), mmToPt(m.top), mmToPt(m.right), mmToPt(m.bottom)],
        header: header?.content?.length
            ? () => ({ stack: (header.content ?? []).flatMap(convertNode), margin: [mmToPt(m.left), 8, mmToPt(m.right), 0] })
            : undefined,
        footer: footer?.content?.length
            ? (_page: number, _pages: number) => ({ stack: (footer.content ?? []).flatMap(convertNode), margin: [mmToPt(m.left), 0, mmToPt(m.right), 8] })
            : undefined,
        background: (cfg?.background && cfg.background !== '#ffffff')
            ? () => ({ canvas: [{ type: 'rect', x: 0, y: 0, w: pageSize[0], h: pageSize[1], color: cfg!.background }] })
            : undefined,
        defaultStyle: { font: 'Roboto', fontSize: 9 },
        styles: {
            h1: { fontSize: 20, bold: true, marginBottom: 6 },
            h2: { fontSize: 16, bold: true, marginBottom: 4 },
            h3: { fontSize: 13, bold: true, marginBottom: 3 },
            h4: { fontSize: 11, bold: true, marginBottom: 3 },
            h5: { fontSize: 10, bold: true, marginBottom: 2 },
            h6: { fontSize: 9,  bold: true, marginBottom: 2 },
            tableHeader: { bold: true, fillColor: '#f3f4f6' },
        },
    }
}

export async function exportToPdf(
    doc:       TipTapDoc,
    filename   = 'reporte',
    pageConfig?: PageConfig,
    header?:   TipTapDoc,
    footer?:   TipTapDoc,
): Promise<void> {
    const docDef = buildPdfDefinition(doc, pageConfig, header, footer)
    await pdfMake.createPdf(docDef).download(`${filename}.pdf`)
}

/**
 * Genera un blob URL con el PDF renderizado (sin descargar).
 * El caller debe revocar el URL con URL.revokeObjectURL() cuando ya no lo necesite.
 */
export async function previewPdf(
    doc:       TipTapDoc,
    pageConfig?: PageConfig,
    header?:   TipTapDoc,
    footer?:   TipTapDoc,
): Promise<string> {
    const docDef = buildPdfDefinition(doc, pageConfig, header, footer)
    const blob = await pdfMake.createPdf(docDef).getBlob()
    return URL.createObjectURL(blob)
}

// ─────────────────────────────────────────────
// Conversión de nodos TipTap → pdfmake Content
// ─────────────────────────────────────────────

function convertNode(node: TipTapNode): Content[] {
    switch (node.type) {
        case 'paragraph':
            return [convertParagraph(node)]
        case 'heading':
            return [convertHeading(node)]
        case 'table':
            return [convertTable(node)]
        case 'bulletList':
            return [{ ul: extractListItems(node) }]
        case 'orderedList':
            return [{ ol: extractListItems(node) }]
        case 'horizontalRule':
            return [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#999999' }], margin: [0, 4, 0, 4] }]
        case 'hardBreak':
            return [{ text: '\n' }]
        case 'pageBreak':
            return [{ text: '', pageBreak: 'before' } as any]
        default:
            return []
    }
}

function convertParagraph(node: TipTapNode, opts?: { inTable?: boolean }): Content {
    const align = node.attrs?.textAlign as string | undefined
    return {
        text: (node.content ?? []).flatMap(convertInline),
        alignment: mapAlign(align),
        margin: opts?.inTable ? [0, 0, 0, 0] : [0, 0, 0, 6],
    }
}

function convertHeading(node: TipTapNode): Content {
    const level = node.attrs?.level ?? 1
    const styleMap: Record<number, string> = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' }
    return {
        text: (node.content ?? []).flatMap(convertInline),
        style: styleMap[level] ?? 'h1',
        margin: [0, 8, 0, 4],
    }
}

function extractListItems(listNode: TipTapNode): Content[] {
    return (listNode.content ?? []).flatMap(item => {
        if (item.type !== 'listItem') return []
        return (item.content ?? []).map(child => convertParagraph(child))
    })
}

type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'none'

// Lee el borde por lado de una celda (objeto pdfmake con _borders adjuntado).
function cellBorderSide(cell: any, side: 'top' | 'right' | 'bottom' | 'left'): BorderStyle {
    if (!cell || typeof cell !== 'object') return 'solid'
    const borders = cell._borders as Record<string, BorderStyle> | undefined
    return borders?.[side] ?? 'solid'
}

// Combina dos bordes internos adyacentes (ambos definidos por celdas reales).
// Reglas:
//   - 'none' tiene precedencia: si cualquiera de las celdas dice no-dibujar, no se dibuja
//   - dashed/dotted vs solid → gana el estilo más específico
function combineBorderStyles(a: BorderStyle, b: BorderStyle): BorderStyle {
    if (a === 'none' || b === 'none') return 'none'
    if (a === 'dotted' || b === 'dotted') return 'dotted'
    if (a === 'dashed' || b === 'dashed') return 'dashed'
    return 'solid'
}

// Resuelve el estilo efectivo de una línea del grid dada una celda "arriba/izquierda"
// y una "abajo/derecha". En los bordes de la tabla una de las dos celdas es null;
// en ese caso se usa el estilo de la celda que sí existe (no se combina con null,
// porque combineBorderStyles convertiría cualquier 'none' implícito en invisible y
// anularía todos los bordes exteriores de la tabla).
function resolveEdgeStyle(
    beforeCell: any, beforeSide: 'bottom' | 'right',
    afterCell:  any, afterSide:  'top'    | 'left',
): BorderStyle {
    if (beforeCell && afterCell) {
        return combineBorderStyles(
            cellBorderSide(beforeCell, beforeSide),
            cellBorderSide(afterCell,  afterSide),
        )
    }
    if (beforeCell) return cellBorderSide(beforeCell, beforeSide)
    if (afterCell)  return cellBorderSide(afterCell,  afterSide)
    return 'none'
}

// Layout factory: lee body[][]._borders y decide ancho + estilo de cada línea
// del grid de pdfmake. También aplica fillColor desde body[][]._fillColor.
function buildGridLayout(): any {
    return {
        hLineWidth: (i: number, node: any) => {
            const body = node.table.body as any[][]
            const colCount = body[0]?.length ?? 0
            let allNone = true
            for (let c = 0; c < colCount; c++) {
                const above = i > 0          ? body[i - 1][c] : null
                const below = i < body.length ? body[i][c]     : null
                const style = resolveEdgeStyle(above, 'bottom', below, 'top')
                if (style !== 'none') { allNone = false; break }
            }
            return allNone ? 0 : 0.5
        },
        vLineWidth: (i: number, node: any) => {
            const body = node.table.body as any[][]
            let allNone = true
            for (const row of body) {
                const left  = i > 0          ? row[i - 1] : null
                const right = i < row.length ? row[i]     : null
                const style = resolveEdgeStyle(left, 'right', right, 'left')
                if (style !== 'none') { allNone = false; break }
            }
            return allNone ? 0 : 0.5
        },
        hLineStyle: (i: number, node: any) => {
            const body = node.table.body as any[][]
            const colCount = body[0]?.length ?? 0
            let style: BorderStyle = 'none'
            for (let c = 0; c < colCount; c++) {
                const above = i > 0          ? body[i - 1][c] : null
                const below = i < body.length ? body[i][c]     : null
                const resolved = resolveEdgeStyle(above, 'bottom', below, 'top')
                if (resolved !== 'none') { style = resolved; break }
            }
            if (style === 'dashed') return { dash: { length: 4, space: 2 } }
            if (style === 'dotted') return { dash: { length: 1, space: 2 } }
            return null
        },
        vLineStyle: (i: number, node: any) => {
            const body = node.table.body as any[][]
            let style: BorderStyle = 'none'
            for (const row of body) {
                const left  = i > 0          ? row[i - 1] : null
                const right = i < row.length ? row[i]     : null
                const resolved = resolveEdgeStyle(left, 'right', right, 'left')
                if (resolved !== 'none') { style = resolved; break }
            }
            if (style === 'dashed') return { dash: { length: 4, space: 2 } }
            if (style === 'dotted') return { dash: { length: 1, space: 2 } }
            return null
        },
        hLineColor: () => '#000000',
        vLineColor: () => '#000000',
        paddingLeft:   () => 4,
        paddingRight:  () => 4,
        paddingTop:    () => 2,
        paddingBottom: () => 2,
        fillColor: (rowIdx: number, node: any, colIdx: number) => {
            const cell = node.table.body?.[rowIdx]?.[colIdx]
            if (cell?._fillColor) return cell._fillColor
            // Fallback: las filas de encabezado (headerRows) llevan fondo gris.
            // pdfmake no aplica `fillColor` del estilo `tableHeader` cuando hay
            // un layout function, así que lo reproducimos aquí.
            const headerRows = node.table.headerRows ?? 0
            if (rowIdx < headerRows) return '#f3f4f6'
            return null
        },
    }
}

// Aproximación de vertical-align en pdfmake (no tiene soporte nativo).
// Para 'middle' añadimos un padding-top extra; para 'bottom' uno mayor.
// El resultado no es exacto, pero se nota la intención.
function vAlignTopPadding(valign: string | undefined): number {
    switch (valign) {
        case 'middle': return 4
        case 'bottom': return 8
        default:       return 0
    }
}

function convertTable(tableNode: TipTapNode): Content {
    const tipRows = (tableNode.content ?? []).filter(n => n.type === 'tableRow')

    // 1. Determinar el total de columnas sumando colspans de la primera fila.
    const firstRowCells = (tipRows[0]?.content ?? [])
        .filter(c => c.type === 'tableCell' || c.type === 'tableHeader')
    let colCount = 0
    for (const c of firstRowCells) colCount += (c.attrs?.colspan as number) ?? 1
    if (colCount === 0) colCount = 1

    // 2. Walk row a row, tracking rowspans pendientes por columna y emitiendo
    //    placeholders '' que pdfmake exige cuando hay colSpan/rowSpan.
    const occupied: number[] = new Array(colCount).fill(0)
    const body: TableCell[][] = []

    for (const row of tipRows) {
        const cells = (row.content ?? [])
            .filter(c => c.type === 'tableCell' || c.type === 'tableHeader')
        const outRow: TableCell[] = []
        let cellIdx = 0
        let col = 0
        while (col < colCount) {
            if (occupied[col] > 0) {
                outRow.push('' as unknown as TableCell)
                occupied[col]--
                col++
                continue
            }
            const cell = cells[cellIdx]
            if (!cell) {
                outRow.push('' as unknown as TableCell)
                col++
                continue
            }
            cellIdx++
            const colSpan = (cell.attrs?.colspan as number) ?? 1
            const rowSpan = (cell.attrs?.rowspan as number) ?? 1
            const valign = (cell.attrs?.verticalAlign as string) || 'top'
            const topPad = vAlignTopPadding(valign)
            const bgColor = cell.attrs?.backgroundColor as string | null | undefined
            const borders = {
                top:    (cell.attrs?.borderTop    as BorderStyle) || 'solid',
                right:  (cell.attrs?.borderRight  as BorderStyle) || 'solid',
                bottom: (cell.attrs?.borderBottom as BorderStyle) || 'solid',
                left:   (cell.attrs?.borderLeft   as BorderStyle) || 'solid',
            }
            const tc: TableCell = {
                stack: (cell.content ?? []).map(p => convertParagraph(p, { inTable: true })),
                style: cell.type === 'tableHeader' ? 'tableHeader' : undefined,
            }
            if (colSpan > 1) (tc as any).colSpan = colSpan
            if (rowSpan > 1) (tc as any).rowSpan = rowSpan
            // Datos leídos por las layout functions para bordes y fondo
            ;(tc as any)._borders = borders
            if (bgColor) (tc as any)._fillColor = bgColor
            // Hack vertical-align: padding-top extra
            if (topPad > 0) (tc as any).margin = [0, topPad, 0, 0]
            outRow.push(tc)
            for (let k = 1; k < colSpan; k++) outRow.push('' as unknown as TableCell)
            if (rowSpan > 1) {
                for (let k = 0; k < colSpan && (col + k) < colCount; k++) {
                    occupied[col + k] = rowSpan - 1
                }
            }
            col += colSpan
        }
        body.push(outRow)
    }

    // Alturas por fila: lee `rowHeight` (px) de cada tableRow; null → 'auto'.
    // pdfmake acepta heights como número (pt), 'auto' o 'star', o función.
    const heights = tipRows.map(row => {
        const h = (row.attrs?.rowHeight as number | null | undefined) ?? null
        if (h && h > 0) return h * 0.75 // px → pt
        return 'auto' as const
    })
    const hasExplicitHeight = heights.some(h => h !== 'auto')

    return {
        table: {
            headerRows: hasHeaderRow(tableNode) ? 1 : 0,
            widths: buildColumnWidths(tableNode, colCount),
            body,
            dontBreakRows: true,
            ...(hasExplicitHeight ? { heights } : {}),
        },
        layout: buildGridLayout(),
        margin: [0, 0, 0, 0],
    }
}

// ─────────────────────────────────────────────
// Nodos inline
// ─────────────────────────────────────────────

function convertInline(node: TipTapNode): Content[] {
    if (node.type !== 'text') return []
    const marks = node.marks ?? []
    const hasMark = (type: string) => marks.some(m => m.type === type)
    const colorMark = marks.find(m => m.type === 'textStyle')

    return [{
        text:       node.text ?? '',
        bold:       hasMark('bold') || undefined,
        italics:    hasMark('italic') || undefined,
        decoration: buildDecoration(hasMark('underline'), hasMark('strike')),
        color:      colorMark?.attrs?.color ?? undefined,
    }]
}

function buildDecoration(underline: boolean, strike: boolean): string | string[] | undefined {
    const d = []
    if (underline) d.push('underline')
    if (strike)    d.push('lineThrough')
    if (d.length === 0) return undefined
    return d.length === 1 ? d[0] : d
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function mapAlign(align?: string): string {
    switch (align) {
        case 'center':  return 'center'
        case 'right':   return 'right'
        case 'justify': return 'justify'
        default:        return 'left'
    }
}

function hasHeaderRow(tableNode: TipTapNode): boolean {
    const firstRow = tableNode.content?.find(n => n.type === 'tableRow')
    return (firstRow?.content ?? []).some(c => c.type === 'tableHeader')
}

function buildColumnWidths(tableNode: TipTapNode, colCount: number): Array<string | number> {
    if (colCount <= 0) return []
    // Recolectar widths (en px) de la primera fila, concatenando cada cw por
    // colSpan. Cada celda trae su colwidth como array de N valores si colSpan=N.
    const pxWidths: Array<number | null> = []
    const firstRow = tableNode.content?.find(n => n.type === 'tableRow')
    const cells = (firstRow?.content ?? [])
        .filter(c => c.type === 'tableCell' || c.type === 'tableHeader')
    for (const cell of cells) {
        const colSpan = (cell.attrs?.colspan as number) ?? 1
        const cw = cell.attrs?.colwidth as number[] | null | undefined
        if (Array.isArray(cw) && cw.length > 0) {
            for (let i = 0; i < colSpan; i++) {
                const px = cw[i] ?? cw[cw.length - 1] ?? null
                pxWidths.push(px ?? null)
            }
        } else {
            for (let i = 0; i < colSpan; i++) pxWidths.push(null)
        }
    }
    while (pxWidths.length < colCount) pxWidths.push(null)

    // Si falta algún width, devolver '*' para todas (distribución equitativa).
    const hasAll = pxWidths.every(w => w !== null && w > 0)
    if (!hasAll) return pxWidths.map(() => '*')

    // Usar widths en PORCENTAJE. pdfmake (columnCalculator.buildColumnWidths)
    // soporta `'N%'` y resta internamente sus propios paddings/borders por
    // columna, dando el content-width exacto. Esto elimina el riesgo de error
    // al aproximar nosotros el overhead (paddings/vLines) manualmente.
    const total = pxWidths.reduce((a, b) => a + (b ?? 0), 0)
    if (total <= 0) return pxWidths.map(() => '*')
    const result = pxWidths.slice(0, colCount).map(w => `${(((w ?? 0) / total) * 100).toFixed(4)}%`)
    // eslint-disable-next-line no-console
    console.log('[pdf] table cols=', colCount, 'pxWidths=', pxWidths.slice(0, colCount), 'percents=', result)
    return result
}
