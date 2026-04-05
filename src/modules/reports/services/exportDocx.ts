/**
 * Exportación a DOCX.
 * Convierte el doc TipTap ya renderizado en un documento Word usando la librería `docx`.
 */
import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, WidthType, BorderStyle, Header, Footer,
    type IParagraphOptions,
} from 'docx'
import type { TipTapDoc, TipTapNode } from './templateEngine'
import type { PageConfig } from '@/modules/reports/types/report.type'

function mmToTwip(mm: number): number { return Math.round(mm * 56.6929) }

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
    const headingMap: Record<number, HeadingLevel> = {
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

function convertTable(tableNode: TipTapNode): Table {
    const rows = (tableNode.content ?? [])
        .filter(n => n.type === 'tableRow')
        .map(row =>
            new TableRow({
                children: (row.content ?? [])
                    .filter(c => c.type === 'tableCell' || c.type === 'tableHeader')
                    .map(cell =>
                        new TableCell({
                            width: { size: 100 / Math.max(1, row.content?.length ?? 1), type: WidthType.PERCENTAGE },
                            children: (cell.content ?? []).map(p => convertParagraph(p)),
                        })
                    ),
            })
        )

    return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })
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

function mapAlign(align?: string): AlignmentType {
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
