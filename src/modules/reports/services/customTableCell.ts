import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { mergeAttributes } from '@tiptap/core'

export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'none'
export const BORDER_STYLES: BorderStyle[] = ['solid', 'dashed', 'dotted', 'none']
export type BorderSide = 'Top' | 'Right' | 'Bottom' | 'Left'

/**
 * Atributos extra que viven tanto en tableCell como en tableHeader:
 *
 *   borderTop / borderRight / borderBottom / borderLeft  (BorderStyle, default 'solid')
 *   backgroundColor   (string CSS o null)
 *   verticalAlign     ('top' | 'middle' | 'bottom', default 'top')
 *
 * Se aplican en el editor via inline `style` desde renderHTML, y se exportan
 * en exportPdf/exportDocx leyendo los attrs.
 *
 * IMPORTANTE: TipTap colapsa los renderHTML de cada attribute en un solo
 * objeto de attrs HTML, así que si dos attributes emiten `style`, se pisan.
 * Por eso sobrescribimos renderHTML del nodo entero y construimos un único
 * `style` combinando background-color + vertical-align + bordes.
 */
const SIDE_TO_DATA: Record<BorderSide, string> = {
    Top:    'data-border-top',
    Right:  'data-border-right',
    Bottom: 'data-border-bottom',
    Left:   'data-border-left',
}

function plainBorderAttr(side: BorderSide) {
    const dataKey = SIDE_TO_DATA[side]
    return {
        default: 'solid' as BorderStyle,
        parseHTML: (el: HTMLElement) => (el.getAttribute(dataKey) as BorderStyle | null) ?? 'solid',
        renderHTML: () => ({}),
    }
}

function buildAttributes() {
    return {
        borderTop:    plainBorderAttr('Top'),
        borderRight:  plainBorderAttr('Right'),
        borderBottom: plainBorderAttr('Bottom'),
        borderLeft:   plainBorderAttr('Left'),
        backgroundColor: {
            default: null as string | null,
            parseHTML: (el: HTMLElement) => el.getAttribute('data-bg') ?? null,
            renderHTML: () => ({}),
        },
        verticalAlign: {
            default: 'top' as 'top' | 'middle' | 'bottom',
            parseHTML: (el: HTMLElement) => ((el.getAttribute('data-valign') as any) ?? 'top'),
            renderHTML: () => ({}),
        },
    }
}

function buildRenderHTML(tag: 'td' | 'th') {
    return ({ HTMLAttributes, node }: { HTMLAttributes: Record<string, any>; node: any }) => {
        const attrs = node.attrs as Record<string, any>
        const styles: string[] = []

        for (const side of ['top', 'right', 'bottom', 'left'] as const) {
            const key = 'border' + side[0].toUpperCase() + side.slice(1)
            const v = attrs[key] as BorderStyle | undefined
            if (!v || v === 'solid') continue
            if (v === 'none') {
                styles.push(`border-${side}: none !important`)
            } else {
                styles.push(`border-${side}-style: ${v} !important`)
            }
        }

        if (attrs.backgroundColor) {
            styles.push(`background-color: ${attrs.backgroundColor} !important`)
        }

        const valign = attrs.verticalAlign as string | undefined
        if (valign && valign !== 'top') {
            styles.push(`vertical-align: ${valign === 'middle' ? 'middle' : 'bottom'}`)
        }

        const dataAttrs: Record<string, string> = {}
        for (const side of ['top', 'right', 'bottom', 'left'] as const) {
            const key = 'border' + side[0].toUpperCase() + side.slice(1)
            const v = attrs[key] as BorderStyle | undefined
            if (v && v !== 'solid') dataAttrs[`data-border-${side}`] = v
        }
        if (attrs.backgroundColor) dataAttrs['data-bg'] = String(attrs.backgroundColor)
        if (valign && valign !== 'top') dataAttrs['data-valign'] = valign

        const merged = mergeAttributes(
            HTMLAttributes,
            dataAttrs,
            styles.length ? { style: styles.join('; ') } : {},
        )
        return [tag, merged, 0]
    }
}

export const CustomTableCell = TableCell.extend({
    addAttributes() {
        return { ...this.parent?.(), ...buildAttributes() }
    },
    renderHTML: buildRenderHTML('td'),
})

export const CustomTableHeader = TableHeader.extend({
    addAttributes() {
        return { ...this.parent?.(), ...buildAttributes() }
    },
    renderHTML: buildRenderHTML('th'),
})
