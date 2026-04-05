/**
 * Motor de plantillas para reportes.
 * Procesa directivas estilo Blade sobre el JSON de TipTap.
 *
 * Directivas soportadas:
 *   {{ expr }}                          — interpolación
 *   @foreach(arr as item)  @endforeach  — ciclo
 *   @if(expr)  @elseif(expr)  @else  @endif  — condicional
 */

export type TipTapNode = {
    type: string
    text?: string
    marks?: Array<{ type: string; attrs?: Record<string, any> }>
    attrs?: Record<string, any>
    content?: TipTapNode[]
}

export type TipTapDoc = {
    type: 'doc'
    content: TipTapNode[]
}

export type TemplateContext = Record<string, any>

// ─────────────────────────────────────────────
// Punto de entrada
// ─────────────────────────────────────────────

export function renderTemplate(doc: TipTapDoc, context: TemplateContext): TipTapDoc {
    return {
        type: 'doc',
        content: processNodes(doc.content ?? [], context),
    }
}

// ─────────────────────────────────────────────
// Procesamiento de nodos
// ─────────────────────────────────────────────

function processNodes(nodes: TipTapNode[], ctx: TemplateContext): TipTapNode[] {
    const result: TipTapNode[] = []
    let i = 0

    while (i < nodes.length) {
        const node = nodes[i]
        const directive = getDirectiveText(node)

        if (directive !== null) {
            if (directive.startsWith('@foreach(')) {
                const parsed = parseForEach(directive)
                if (!parsed) { i++; continue }

                const { end, body } = collectBlock(nodes, i + 1, '@endforeach', ['@foreach('])
                const arr = resolvePath(parsed.arrPath, ctx)
                if (Array.isArray(arr)) {
                    for (let idx = 0; idx < arr.length; idx++) {
                        const itemCtx: TemplateContext = {
                            ...ctx,
                            [parsed.itemName]: arr[idx],
                            loop: { index: idx, first: idx === 0, last: idx === arr.length - 1, count: arr.length },
                        }
                        result.push(...processNodes(body, itemCtx))
                    }
                }
                i = end + 1

            } else if (directive.startsWith('@if(')) {
                const { branches, end } = collectIfBranches(nodes, i)
                const rendered = evaluateIfBranches(branches, ctx)
                result.push(...processNodes(rendered, ctx))
                i = end + 1

            } else {
                // Directiva desconocida — omitir el nodo
                i++
            }
        } else {
            result.push(processNode(node, ctx))
            i++
        }
    }

    return result
}

/** Procesa un nodo no-directiva: interpola texto y desciende recursivamente. */
function processNode(node: TipTapNode, ctx: TemplateContext): TipTapNode {
    if (node.type === 'text' && node.text) {
        return { ...node, text: interpolate(node.text, ctx) }
    }
    if (node.content) {
        return { ...node, content: processNodes(node.content, ctx) }
    }
    return node
}

// ─────────────────────────────────────────────
// Interpolación  {{ expr }}
// ─────────────────────────────────────────────

const INTERP_RE = /\{\{\s*(.+?)\s*\}\}/g

function interpolate(text: string, ctx: TemplateContext): string {
    return text.replace(INTERP_RE, (_, expr) => {
        const val = evaluateExpr(expr.trim(), ctx)
        return val === null || val === undefined ? '' : String(val)
    })
}

// ─────────────────────────────────────────────
// Detección de directivas
// ─────────────────────────────────────────────

/**
 * Retorna el texto de la directiva si el nodo es un párrafo que contiene
 * únicamente una directiva (@...). De lo contrario retorna null.
 */
function getDirectiveText(node: TipTapNode): string | null {
    if (node.type !== 'paragraph') return null
    const texts = (node.content ?? []).filter(n => n.type === 'text')
    if (texts.length === 0) return null
    // Concatenar todo el texto del párrafo
    const full = texts.map(n => n.text ?? '').join('').trim()
    return full.startsWith('@') ? full : null
}

// ─────────────────────────────────────────────
// @foreach
// ─────────────────────────────────────────────

function parseForEach(directive: string): { arrPath: string; itemName: string } | null {
    const m = directive.match(/^@foreach\(\s*([\w.]+)\s+as\s+(\w+)\s*\)$/)
    if (!m) return null
    return { arrPath: m[1], itemName: m[2] }
}

// ─────────────────────────────────────────────
// @if / @elseif / @else / @endif
// ─────────────────────────────────────────────

type IfBranch = { condition: string | null; body: TipTapNode[] }

function collectIfBranches(
    nodes: TipTapNode[],
    start: number,
): { branches: IfBranch[]; end: number } {
    const branches: IfBranch[] = []
    let i = start
    const firstDirective = getDirectiveText(nodes[i])!
    const firstCond = firstDirective.match(/^@if\(\s*(.+)\s*\)$/)?.[1] ?? null
    let currentBranch: IfBranch = { condition: firstCond, body: [] }
    let depth = 0
    i++

    while (i < nodes.length) {
        const d = getDirectiveText(nodes[i])

        if (d !== null) {
            if (d.startsWith('@if(')) depth++

            if (depth === 0) {
                if (d.startsWith('@elseif(')) {
                    branches.push(currentBranch)
                    const cond = d.match(/^@elseif\(\s*(.+)\s*\)$/)?.[1] ?? null
                    currentBranch = { condition: cond, body: [] }
                    i++; continue
                }
                if (d === '@else') {
                    branches.push(currentBranch)
                    currentBranch = { condition: null, body: [] }
                    i++; continue
                }
                if (d === '@endif') {
                    branches.push(currentBranch)
                    return { branches, end: i }
                }
            }

            if (d === '@endif') depth--
        }

        currentBranch.body.push(nodes[i])
        i++
    }

    // @endif no encontrado — incluir lo que hay
    branches.push(currentBranch)
    return { branches, end: i - 1 }
}

function evaluateIfBranches(branches: IfBranch[], ctx: TemplateContext): TipTapNode[] {
    for (const branch of branches) {
        // branch.condition === null → @else
        if (branch.condition === null || isTruthy(evaluateExpr(branch.condition, ctx))) {
            return branch.body
        }
    }
    return []
}

// ─────────────────────────────────────────────
// Recolector genérico de bloques (con soporte anidado)
// ─────────────────────────────────────────────

function collectBlock(
    nodes: TipTapNode[],
    start: number,
    endDirective: string,
    openDirectivePrefixes: string[],
): { body: TipTapNode[]; end: number } {
    const body: TipTapNode[] = []
    let depth = 0
    let i = start

    while (i < nodes.length) {
        const d = getDirectiveText(nodes[i])

        if (d !== null) {
            if (openDirectivePrefixes.some(prefix => d.startsWith(prefix))) depth++
            if (d === endDirective) {
                if (depth === 0) return { body, end: i }
                depth--
            }
        }

        body.push(nodes[i])
        i++
    }

    return { body, end: i - 1 }
}

// ─────────────────────────────────────────────
// Evaluador de expresiones (sin eval)
// ─────────────────────────────────────────────

function evaluateExpr(expr: string, ctx: TemplateContext): any {
    expr = expr.trim()

    // OR  (menor precedencia)
    const orParts = splitByTopLevelOp(expr, '||')
    if (orParts.length > 1) return orParts.some(p => isTruthy(evaluateExpr(p, ctx)))

    // AND
    const andParts = splitByTopLevelOp(expr, '&&')
    if (andParts.length > 1) return andParts.every(p => isTruthy(evaluateExpr(p, ctx)))

    // NOT
    if (expr.startsWith('!')) return !isTruthy(evaluateExpr(expr.slice(1).trim(), ctx))

    // Comparaciones: ===, !==, ==, !=, >=, <=, >, <
    const compRe = /^(.+?)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/
    const cm = expr.match(compRe)
    if (cm) {
        const left  = resolveValue(cm[1].trim(), ctx)
        const op    = cm[2]
        const right = resolveValue(cm[3].trim(), ctx)
        // eslint-disable-next-line eqeqeq
        if (op === '=='  || op === '===') return left == right
        // eslint-disable-next-line eqeqeq
        if (op === '!='  || op === '!==') return left != right
        if (op === '>=' ) return left >= right
        if (op === '<=' ) return left <= right
        if (op === '>'  ) return left >  right
        if (op === '<'  ) return left <  right
    }

    return resolveValue(expr, ctx)
}

/** Resuelve un valor: literal string/number/bool o path de contexto. */
function resolveValue(expr: string, ctx: TemplateContext): any {
    expr = expr.trim()
    if ((expr.startsWith("'") && expr.endsWith("'")) ||
        (expr.startsWith('"') && expr.endsWith('"'))) {
        return expr.slice(1, -1)
    }
    if (expr === 'true')  return true
    if (expr === 'false') return false
    if (expr === 'null')  return null
    if (!isNaN(Number(expr))) return Number(expr)
    return resolvePath(expr, ctx)
}

/** Resuelve un path anidado tipo "alumno.direccion.ciudad" en el contexto. */
function resolvePath(path: string, ctx: TemplateContext): any {
    return path.split('.').reduce<any>((obj, key) => {
        if (obj === null || obj === undefined) return undefined
        return obj[key]
    }, ctx)
}

function isTruthy(val: any): boolean {
    if (Array.isArray(val)) return val.length > 0
    return Boolean(val)
}

/**
 * Divide una expresión por un operador binario de nivel superior,
 * ignorando los que están dentro de paréntesis o strings.
 */
function splitByTopLevelOp(expr: string, op: string): string[] {
    const parts: string[] = []
    let depth = 0
    let inStr: null | string = null
    let current = ''

    for (let i = 0; i < expr.length; i++) {
        const ch = expr[i]

        if (inStr) {
            current += ch
            if (ch === inStr) inStr = null
            continue
        }
        if (ch === "'" || ch === '"') { inStr = ch; current += ch; continue }
        if (ch === '(') { depth++; current += ch; continue }
        if (ch === ')') { depth--; current += ch; continue }

        if (depth === 0 && expr.slice(i, i + op.length) === op) {
            parts.push(current.trim())
            current = ''
            i += op.length - 1
            continue
        }

        current += ch
    }
    if (current.trim()) parts.push(current.trim())
    return parts.length > 1 ? parts : [expr]
}
