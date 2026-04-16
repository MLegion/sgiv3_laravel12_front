import { TableRow } from '@tiptap/extension-table-row'
import { mergeAttributes } from '@tiptap/core'

/**
 * Extiende `tableRow` con un atributo `rowHeight` (px) que permite fijar la
 * altura de la fila desde el ribbon ("Alto fila"). Se serializa como
 * `style="height:Xpx"` en el HTML del editor y se lee en exportPdf/Docx para
 * generar las `heights` del PDF/DOCX.
 */
export const CustomTableRow = TableRow.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            rowHeight: {
                default: null as number | null,
                parseHTML: (el: HTMLElement) => {
                    const explicit = el.getAttribute('data-row-height')
                    if (explicit) return parseInt(explicit, 10) || null
                    const style = el.getAttribute('style') ?? ''
                    const m = /height\s*:\s*(\d+(?:\.\d+)?)px/i.exec(style)
                    return m ? parseFloat(m[1]) : null
                },
                renderHTML: () => ({}),
            },
        }
    },
    renderHTML({ HTMLAttributes, node }) {
        const height = (node.attrs as any).rowHeight as number | null
        const extra: Record<string, any> = {}
        if (height && height > 0) {
            extra['data-row-height'] = String(height)
            extra.style = `height: ${height}px`
        }
        return ['tr', mergeAttributes(HTMLAttributes, extra), 0]
    },
})
