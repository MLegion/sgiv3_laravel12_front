import { Node, mergeAttributes } from '@tiptap/core'

export interface ImageAttrs {
    src:   string
    alt:   string
    title: string
    width: string          // '200px' | '50%' | 'auto'
    align: 'left' | 'center' | 'right'
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        image: {
            setImage:    (options: Partial<ImageAttrs> & { src: string }) => ReturnType
            updateImage: (attrs: Partial<ImageAttrs>) => ReturnType
        }
    }
}

function buildStyle(width: string, align: string): string {
    const s: string[] = ['max-width: 100%']
    if (width && width !== 'auto') s.push(`width: ${width}`)
    if (align === 'center') {
        s.push('display: block', 'margin-left: auto', 'margin-right: auto')
    } else if (align === 'right') {
        s.push('float: right', 'margin-left: 8px', 'margin-bottom: 4px')
    } else {
        // left (default)
        s.push('display: block')
    }
    return s.join('; ')
}

export const ReportImage = Node.create({
    name:       'image',
    group:      'block',
    atom:       true,
    draggable:  true,
    selectable: true,

    addAttributes() {
        return {
            src:   { default: null },
            alt:   { default: '' },
            title: { default: '' },
            width: { default: 'auto' },
            align: { default: 'left' },
        }
    },

    parseHTML() {
        return [{ tag: 'img[src]' }]
    },

    renderHTML({ HTMLAttributes }) {
        const { width, align, ...rest } = HTMLAttributes
        return ['img', mergeAttributes(rest, {
            style: buildStyle(width ?? 'auto', align ?? 'left'),
            class: 'report-image',
        })]
    },

    addCommands() {
        return {
            setImage: (options) => ({ commands }) =>
                commands.insertContent({ type: 'image', attrs: options }),
            updateImage: (attrs) => ({ commands }) =>
                commands.updateAttributes('image', attrs),
        }
    },
})
