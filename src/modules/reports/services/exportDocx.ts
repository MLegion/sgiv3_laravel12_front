/**
 * Exportación a DOCX.
 * Convierte el doc TipTap ya renderizado en un documento Word usando la librería `docx`.
 */
import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, WidthType, BorderStyle, Header, Footer,
    VerticalAlign, ShadingType,
    type IParagraphOptions, type ITableBordersOptions,
} from 'docx'
import type { TipTapDoc, TipTapNode } from './templateEngine'
import type { PageConfig } from '@/modules/reports/types/report.type'

function mmToTwip(mm: number): number { return Math.round(mm * 56.6929) }
// TipTap guarda colwidth en píxeles @96DPI. docx usa DXA (1/20 pt). 1 px = 0.75 pt = 15 DXA.
function pxToDxa(px: number): number { return Math.round(px * 15) }

export async function exportToDocx(
    doc:        TipTapDoc,
    filename    = 'reporte',
    pageConfig?: PageConfig,
    header?:    TipTapDoc,
    footer?:    TipTapDoc,
): Promise<void> {
    const children = (doc.content ?? []).flatMap(node => convertNode(node))
    const m = pageConfig?.margins ?? { top: 25, right: 20, bottom: 25, left: 20 }

    const document = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top:    mmToTwip(m.top),
                        right:  mmToTwip(m.right),
                        bottom: mmToTwip(m.bottom),
                        left:   mmToTwip(m.left),
                    },
                },
            },
            headers: header?.content?.length
                ? { default: new Header({ children: (header.content ?? []).flatMap(convertNode) as Paragraph[] }) }
                : undefined,
            footers: footer?.content?.length
                ? { default: new Footer({ children: (footer.content ?? []).flatMap(convertNode) as Paragraph[] }) }
                : undefined,
            children,
        }],
    })

    const blob = await Packer.toBlob(document)
    downloadBlob(blob, `${filename}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
}

// ─────────────────────────────────────────────
// Conversión de nodos TipTap → docx
// ─────────────────────────────────────────────

function convertNode(node: TipTapNode): Array<Paragraph | Table> {
    switch (node.type) {
        case 'paragraph':    return [convertParagraph(node)]
        case 'heading':      return [convertHeading(node)]
        case 'table':        return [convertTable(node)]
        case 'bulletList':
        case 'orderedList':  return convertList(node)
        case 'horizontalRule':
            return [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '999999' } } })]
        case 'pageBreak':
            return [new Paragraph({ pageBreakBefore: true })]
        default:             return []
    }
}

function convertParagraph(node: TipTapNode, opts: IParagraphOptions = {}): Paragraph {
    const align = node.attrs?.textAlign
    return new Paragraph({
        ...opts,
        alignment: mapAlign(align),
        children: (node.content ?? []).flatMap(convertInline),
    })
}

function convertHeading(node: TipTapNode): Paragraph {
    const level = node.attrs?.level ?? 1
    const headingMap: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
    }
    return new Paragraph({
        heading: headingMap[level] ?? HeadingLevel.HEADING_1,
        children: (node.content ?? []).flatMap(convertInline),
    })
}

function convertList(listNode: TipTapNode): Paragraph[] {
    return (listNode.content ?? []).flatMap(item => {
        if (item.type !== 'listItem') return []
        return (item.content ?? []).map(child =>
            convertParagraph(child, {
                bullet: listNode.type === 'bulletList' ? { level: 0 } : undefined,
                numbering: listNode.type === 'orderedList' ? { reference: 'default', level: 0 } : undefined,
            })
        )
    })
}

// ─────────────────────────────────────────────
// Tablas: colspan / rowspan / bordes / bg / valign
// ─────────────────────────────────────────────

type BorderName = 'solid' | 'dashed' | 'dotted' | 'none'

function mapBorderStyle(style: BorderName) {
    switch (style) {
        case 'none':   return { style: BorderStyle.NONE,    size: 0, color: 'FFFFFF' }
        case 'dashed': return { style: BorderStyle.DASHED,  size: 4, color: '000000' }
        case 'dotted': return { style: BorderStyle.DOTTED,  size: 4, color: '000000' }
        default:       return { style: BorderStyle.SINGLE,  size: 4, color: '000000' }
    }
}

function mapVerticalAlign(v: string): (typeof VerticalAlign)[keyof typeof VerticalAlign] {
    if (v === 'middle') return VerticalAlign.CENTER
    if (v === 'bottom') return VerticalAlign.BOTTOM
    return VerticalAlign.TOP
}

function convertTable(tableNode: TipTapNode): Table {
    const tipRows = (tableNode.content ?? []).filter(n => n.type === 'tableRow')

    // 1. colCount + columnWidths desde la primera fila (respetando colspans)
    const firstRowCells = (tipRows[0]?.content ?? [])
        .filter(c => c.type === 'tableCell' || c.type === 'tableHeader')
    let colCount = 0
    const columnWidths: number[] = []
    for (const cell of firstRowCells) {
        const colSpan = (cell.attrs?.colspan as number) ?? 1
        colCount += colSpan
        const cw = cell.attrs?.colwidth as number[] | null | undefined
        if (Array.isArray(cw) && cw.length > 0) {
            for (let i = 0; i < colSpan; i++) {
                const px = cw[i] ?? cw[cw.length - 1] ?? 100
                columnWidths.push(pxToDxa(px))
            }
        } else {
            for (let i = 0; i < colSpan; i++) columnWidths.push(1500)
        }
    }
    if (colCount === 0) colCount = 1

    // 2. Filas. docx maneja rowspan nativamente: la fila siguiente simplemente
    //    tiene menos celdas, el rowspan anterior "absorbe" el espacio. Mismo
    //    modelo que TipTap, así que pasamos la estructura directo.
    const rows: TableRow[] = []
    for (const row of tipRows) {
        const cells = (row.content ?? [])
            .filter(c => c.type === 'tableCell' || c.type === 'tableHeader')
        const docxCells = cells.map(cell => {
            const colSpan = (cell.attrs?.colspan as number) ?? 1
            const rowSpan = (cell.attrs?.rowspan as number) ?? 1
            const valign  = (cell.attrs?.verticalAlign as string) || 'top'
            const bgColor = cell.attrs?.backgroundColor as string | undefined
            const borders: ITableBordersOptions = {
                top:    mapBorderStyle(((cell.attrs?.borderTop    as BorderName) || 'solid')),
                right:  mapBorderStyle(((cell.attrs?.borderRight  as BorderName) || 'solid')),
                bottom: mapBorderStyle(((cell.attrs?.borderBottom as BorderName) || 'solid')),
                left:   mapBorderStyle(((cell.attrs?.borderLeft   as BorderName) || 'solid')),
            }
            return new TableCell({
                children: (cell.content ?? []).map(p => convertParagraph(p)),
                columnSpan: colSpan > 1 ? colSpan : undefined,
                rowSpan:    rowSpan > 1 ? rowSpan : undefined,
                verticalAlign: mapVerticalAlign(valign),
                shading: bgColor
                    ? { fill: bgColor.replace('#', ''), type: ShadingType.CLEAR, color: 'auto' }
                    : undefined,
                borders,
            })
        })
        // Alto explícito (px → DXA; 1 px = 15 DXA aprox). `atLeast` hace que
        // docx respete el mínimo pero lo crezca si el contenido no cabe.
        const rowHeightPx = (row.attrs?.rowHeight as number | null | undefined) ?? null
        const rowOpts: any = { children: docxCells }
        if (rowHeightPx && rowHeightPx > 0) {
            rowOpts.height = { value: Math.round(rowHeightPx * 15), rule: 'atLeast' }
        }
        rows.push(new TableRow(rowOpts))
    }

    return new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths,
    })
}

// ─────────────────────────────────────────────
// Nodos inline (text + marks)
// ─────────────────────────────────────────────

function convertInline(node: TipTapNode): TextRun[] {
    if (node.type !== 'text') return []
    const marks = node.marks ?? []
    const hasMark = (type: string) => marks.some(m => m.type === type)
    const colorMark = marks.find(m => m.type === 'textStyle')

    return [new TextRun({
        text:          node.text ?? '',
        bold:          hasMark('bold'),
        italics:       hasMark('italic'),
        underline:     hasMark('underline') ? {} : undefined,
        strike:        hasMark('strike'),
        color:         colorMark?.attrs?.color?.replace('#', '') ?? undefined,
    })]
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function mapAlign(align?: string): (typeof AlignmentType)[keyof typeof AlignmentType] {
    switch (align) {
        case 'center':  return AlignmentType.CENTER
        case 'right':   return AlignmentType.RIGHT
        case 'justify': return AlignmentType.JUSTIFIED
        default:        return AlignmentType.LEFT
    }
}

function downloadBlob(blob: Blob, filename: string, mime: string): void {
    const url  = URL.createObjectURL(new Blob([blob], { type: mime }))
    const link = document.createElement('a')
    link.href  = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}
