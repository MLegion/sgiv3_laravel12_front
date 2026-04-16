import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as PMNode } from '@tiptap/pm/model'

/**
 * Decoración inline que envuelve las ocurrencias de `{{ expr }}` / `@foreach(...)` /
 * `@if(...)` / `@endforeach` / `@endif` en un span con clase `.tpl-var-chip`
 * (o `.tpl-dir-chip` para directivas). El CSS asociado renderiza el texto como
 * un chip compacto (fuente pequeña + fondo azul) para que los templates no
 * inflen el ancho de las celdas en el editor.
 *
 * NO modifica el documento — es puramente visual. El serializado sigue siendo
 * texto plano `{{ ... }}`, y los exportadores (PDF/DOCX) y el templateEngine
 * lo procesan exactamente igual que antes.
 */
const TPL_VAR_RE = /\{\{\s*[^}]+?\s*\}\}/g
const TPL_DIR_RE = /@(?:foreach\([^)]*\)|endforeach|if\([^)]*\)|elseif\([^)]*\)|else|endif)/g

function buildDecorations(doc: PMNode): DecorationSet {
    const decos: Decoration[] = []
    doc.descendants((node, pos) => {
        if (!node.isText || !node.text) return
        const text = node.text
        let m: RegExpExecArray | null

        TPL_VAR_RE.lastIndex = 0
        while ((m = TPL_VAR_RE.exec(text)) !== null) {
            const from = pos + m.index
            const to = from + m[0].length
            decos.push(Decoration.inline(from, to, {
                class: 'tpl-var-chip',
                'data-tpl-label': m[0].replace(/^\{\{\s*|\s*\}\}$/g, ''),
            } as any))
        }

        TPL_DIR_RE.lastIndex = 0
        while ((m = TPL_DIR_RE.exec(text)) !== null) {
            const from = pos + m.index
            const to = from + m[0].length
            decos.push(Decoration.inline(from, to, { class: 'tpl-dir-chip' }))
        }
    })
    return DecorationSet.create(doc, decos)
}

export const TemplateChipDecoration = Extension.create({
    name: 'templateChipDecoration',

    addProseMirrorPlugins() {
        const key = new PluginKey('templateChipDecoration')
        return [
            new Plugin({
                key,
                state: {
                    init: (_c, { doc }) => buildDecorations(doc),
                    apply: (tr, oldSet) => tr.docChanged ? buildDecorations(tr.doc) : oldSet,
                },
                props: {
                    decorations(state) {
                        return (this as any).getState(state) as DecorationSet
                    },
                },
            }),
        ]
    },
})
