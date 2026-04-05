/**
 * Exportación a XLSX.
 * Recorre el doc TipTap ya renderizado (con directivas resueltas) y extrae
 * los nodos "table" → cada tabla se convierte en una hoja del libro Excel.
 */
import * as XLSX from 'xlsx'
import type { TipTapDoc, TipTapNode } from './templateEngine'

export function exportToXlsx(doc: TipTapDoc, filename = 'reporte'): void {
    const wb = XLSX.utils.book_new()
    let sheetIndex = 0

    for (const node of doc.content ?? []) {
        if (node.type !== 'table') continue
        sheetIndex++

        const rows = extractTableRows(node)
        if (rows.length === 0) continue

        const ws = XLSX.utils.aoa_to_sheet(rows)
        autoFitColumns(ws, rows)
        XLSX.utils.book_append_sheet(wb, ws, `Tabla ${sheetIndex}`)
    }

    if (sheetIndex === 0) {
        console.warn('[exportXlsx] El documento no contiene tablas.')
        return
    }

    XLSX.writeFile(wb, `${filename}.xlsx`)
}

/** Extrae todas las filas de un nodo tabla como arrays de strings. */
function extractTableRows(tableNode: TipTapNode): string[][] {
    const rows: string[][] = []

    for (const rowNode of tableNode.content ?? []) {
        if (rowNode.type !== 'tableRow') continue
        const cells: string[] = []

        for (const cellNode of rowNode.content ?? []) {
            if (cellNode.type !== 'tableCell' && cellNode.type !== 'tableHeader') continue
            cells.push(extractText(cellNode))
        }

        rows.push(cells)
    }

    return rows
}

/** Extrae texto recursivamente de cualquier nodo. */
function extractText(node: TipTapNode): string {
    if (node.type === 'text') return node.text ?? ''
    return (node.content ?? []).map(extractText).join('')
}

/** Ajusta el ancho de columnas al contenido más largo. */
function autoFitColumns(ws: XLSX.WorkSheet, rows: string[][]): void {
    if (rows.length === 0) return
    const colWidths = rows[0].map((_, colIdx) =>
        Math.min(60, Math.max(10, ...rows.map(row => (row[colIdx] ?? '').length + 2)))
    )
    ws['!cols'] = colWidths.map(w => ({ wch: w }))
}
