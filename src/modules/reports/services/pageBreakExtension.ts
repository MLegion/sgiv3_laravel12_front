import { Node } from '@tiptap/core'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        pageBreak: {
            insertPageBreak: () => ReturnType
        }
    }
}

/**
 * Extensión TipTap: salto de página.
 * Se renderiza como una línea visual en el editor.
 * Los exportadores detectan este nodo y emiten el salto real (PDF/DOCX).
 */
export const PageBreak = Node.create({
    name: 'pageBreak',
    group: 'block',
    atom: true,       // no tiene contenido editable, se trata como unidad
    selectable: true,
    draggable: true,

    parseHTML() {
        return [{ tag: 'div[data-page-break]' }]
    },

    renderHTML() {
        return ['div', {
            'data-page-break': 'true',
            class: 'page-break-node',
        }]
    },

    addCommands() {
        return {
            insertPageBreak: () => ({ chain }: any) =>
                chain().insertContent({ type: 'pageBreak' }).run(),
        }
    },
})
