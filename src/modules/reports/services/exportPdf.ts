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

export function exportToPdf(
    doc:       TipTapDoc,
    filename   = 'reporte',
    pageConfig?: PageConfig,
    header?:   TipTapDoc,
    footer?:   TipTapDoc,
): void {
    const cfg = pageConfig
    const content: Content[] = (doc.content ?? []).flatMap(convertNode)
    const size = PAGE_SIZES_PT[cfg?.size ?? 'Letter'] ?? PAGE_SIZES_PT['Letter']
    const portrait = (cfg?.orientation ?? 'portrait') === 'portrait'
    const pageSize: [number, number] = portrait ? size : [size[1], size[0]]
    const m = cfg?.margins ?? { top: 25, right: 20, bottom: 25, left: 20 }

    const docDef: TDocumentDefinitions = {
        content,
        pageSize:    { width: pageSize[0], height: pageSize[1] },
        pageMargins: [mmToPt(m.left), mmToPt(m.top), mmToPt(m.right), mmToPt(m.bottom)],
        header: header?.content?.length
            ? () => ({ stack: (header.content ?? []).flatMap(convertNode), margin: [mmToPt(m.left), 8, mmToPt(m.right), 0] })
            : undefined,
        footer: footer?.content?.length
            ? (_page: number, pages: number) => ({ stack: (footer.content ?? []).flatMap(convertNode), margin: [mmToPt(m.left), 0, mmToPt(m.right), 8] })
            : undefined,
        background: (cfg?.background && cfg.background !== '#ffffff')
            ? () => ({ canvas: [{ type: 'rect', x: 0, y: 0, w: pageSize[0], h: pageSize[1], color: cfg!.background }] })
            : undefined,
        defaultStyle: { font: 'Roboto', fontSize: 11 },
        styles: {
            h1: { fontSize: 22, bold: true, marginBottom: 8 },
            h2: { fontSize: 18, bold: true, marginBottom: 6 },
            h3: { fontSize: 15, bold: true, marginBottom: 4 },
            h4: { fontSize: 13, bold: true, marginBottom: 4 },
            h5: { fontSize: 11, bold: true, marginBottom: 2 },
            h6: { fontSize: 10, bold: true, marginBottom: 2 },
            tableHeader: { bold: true, fillColor: '#f3f4f6' },
        },
    }

    pdfMake.createPdf(docDef).download(`${filename}.pdf`)
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

function convertParagraph(node: TipTapNode): Content {
    const align = node.attrs?.textAlign as string | undefined
    return {
        text: (node.content ?? []).flatMap(convertInline),
        alignment: mapAlign(align),
        margin: [0, 0, 0, 6],
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

function convertTable(tableNode: TipTapNode): Content {
    const rows = (tableNode.content ?? [])
        .filter(n => n.type === 'tableRow')
        .map(row =>
            (row.content ?? [])
                .filter(c => c.type === 'tableCell' || c.type === 'tableHeader')
                .map((cell): TableCell => ({
                    stack: (cell.content ?? []).map(convertParagraph),
                    style: cell.type === 'tableHeader' ? 'tableHeader' : undefined,
                    border: [true, true, true, true],
                    margin: [4, 4, 4, 4],
                }))
        )

    return {
        table: {
            headerRows: hasHeaderRow(tableNode) ? 1 : 0,
            widths: buildColumnWidths(tableNode),
            body: rows,
        },
        layout: 'lightHorizontalLines',
        margin: [0, 4, 0, 8],
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

function buildColumnWidths(tableNode: TipTapNode): Array<string | number> {
    const firstRow = tableNode.content?.find(n => n.type === 'tableRow')
    const colCount = (firstRow?.content ?? []).length
    if (colCount === 0) return []
    return Array(colCount).fill('*')
}
