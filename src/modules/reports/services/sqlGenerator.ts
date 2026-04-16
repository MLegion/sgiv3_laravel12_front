/**
 * Generador SQL JS — espejo del `SqlQueryGenerator.php` del backend.
 *
 * Produce un preview del SQL en vivo mientras el usuario edita en el Query Builder.
 * El backend es la fuente de verdad (regenera al guardar), pero esta versión JS
 * permite mostrar el SQL que se ejecutaría sin hacer roundtrip al servidor.
 */
import type {
    QueryStructure,
    JoinClause,
    ColumnSelection,
    Condition,
    ConditionTree,
    GroupByField,
    OrderByField,
} from '@/modules/reports/types/queryBuilder.type'

const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/

const VALID_AGGREGATES = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN']
const VALID_OPERATORS = [
    '=', '!=', '<>', '>', '>=', '<', '<=',
    'LIKE', 'NOT LIKE',
    'IN', 'NOT IN',
    'IS NULL', 'IS NOT NULL',
    'BETWEEN', 'NOT BETWEEN',
]
const VALID_JOIN_TYPES = ['inner', 'left', 'right']
const VALID_DIRECTIONS = ['asc', 'desc']
const VALID_CONJUNCTIONS = ['and', 'or']

export interface GenerationResult {
    sql: string
    literalBindings: Record<string, unknown>
    error?: string
}

export function generateSql(structure: QueryStructure | null | undefined): GenerationResult {
    if (!structure) {
        return { sql: '', literalBindings: {}, error: 'Sin estructura.' }
    }

    const ctx = { literalCounter: 0, literalBindings: {} as Record<string, unknown> }

    try {
        const parts: string[] = []
        parts.push(buildSelect(structure.columns))
        parts.push(buildFrom(structure))

        if (structure.joins?.length) parts.push(buildJoins(structure.joins))
        if (structure.where?.conditions?.length) parts.push('WHERE ' + buildConditionTree(structure.where, ctx))
        if (structure.groupBy?.length) parts.push(buildGroupBy(structure.groupBy))
        if (structure.having?.conditions?.length) parts.push('HAVING ' + buildConditionTree(structure.having, ctx))
        if (structure.orderBy?.length) parts.push(buildOrderBy(structure.orderBy))
        if (structure.limit != null && structure.limit > 0) parts.push('LIMIT ' + Math.floor(structure.limit))

        return {
            sql: parts.filter(p => p !== '').join('\n'),
            literalBindings: ctx.literalBindings,
        }
    } catch (e: any) {
        return {
            sql: '',
            literalBindings: ctx.literalBindings,
            error: e?.message ?? 'Error al generar SQL',
        }
    }
}

/* ───── SELECT ───── */

function buildSelect(columns?: ColumnSelection[]): string {
    if (!columns?.length) return 'SELECT *'
    const parts = columns.map(renderColumn)
    return 'SELECT ' + parts.join(', ')
}

function renderColumn(col: ColumnSelection): string {
    const column = String(col.column ?? '')
    const table = col.table ? String(col.table) : null
    const alias = col.alias ? String(col.alias) : null
    const agg = col.aggregate ? String(col.aggregate).toUpperCase() : null

    if (column !== '*') assertIdentifier(column, 'columna')
    if (table) assertIdentifier(table, 'tabla')
    if (alias) assertIdentifier(alias, 'alias')
    if (agg && !VALID_AGGREGATES.includes(agg)) {
        throw new Error(`Función de agregación inválida: ${agg}`)
    }

    const ref = quoteColumnRef(table, column)
    let expr = agg ? `${agg}(${ref})` : ref
    if (alias) expr += ' AS ' + quoteIdentifier(alias)
    return expr
}

/* ───── FROM ───── */

function buildFrom(structure: QueryStructure): string {
    const from = structure.from
    if (!from || !from.table) {
        throw new Error('La estructura debe tener `from.table`.')
    }
    assertIdentifier(from.table, 'tabla')
    if (from.alias) assertIdentifier(from.alias, 'alias')

    let sql = 'FROM ' + quoteIdentifier(from.table)
    if (from.alias) sql += ' AS ' + quoteIdentifier(from.alias)
    return sql
}

/* ───── JOINS ───── */

function buildJoins(joins: JoinClause[]): string {
    const parts: string[] = []
    for (const join of joins) {
        const type = String(join.type ?? 'inner').toLowerCase()
        if (!VALID_JOIN_TYPES.includes(type)) {
            throw new Error(`Tipo de JOIN inválido: ${type}`)
        }
        assertIdentifier(join.table, 'tabla')
        if (join.alias) assertIdentifier(join.alias, 'alias')

        if (!join.on?.left || !join.on?.right) {
            throw new Error('JOIN requiere on.left y on.right')
        }

        const leftRef = parseQualifiedRef(join.on.left)
        const rightRef = parseQualifiedRef(join.on.right)

        let clause = type.toUpperCase() + ' JOIN ' + quoteIdentifier(join.table)
        if (join.alias) clause += ' AS ' + quoteIdentifier(join.alias)
        clause += ' ON ' + leftRef + ' = ' + rightRef

        parts.push(clause)
    }
    return parts.join('\n')
}

/* ───── WHERE / HAVING ───── */

function buildConditionTree(tree: ConditionTree, ctx: { literalCounter: number; literalBindings: Record<string, unknown> }): string {
    const conjunction = String(tree.conjunction ?? 'and').toLowerCase()
    if (!VALID_CONJUNCTIONS.includes(conjunction)) {
        throw new Error(`Conjunción inválida: ${conjunction}`)
    }
    if (!tree.conditions?.length) return ''

    const parts = tree.conditions.map(c => renderCondition(c, ctx))
    return parts.join('\n  ' + conjunction.toUpperCase() + ' ')
}

function renderCondition(cond: Condition, ctx: { literalCounter: number; literalBindings: Record<string, unknown> }): string {
    const operator = String(cond.operator ?? '=').toUpperCase().trim()
    if (!VALID_OPERATORS.includes(operator)) {
        throw new Error(`Operador inválido: ${operator}`)
    }

    const column = String(cond.column ?? '')
    const table = cond.table ? String(cond.table) : null
    assertIdentifier(column, 'columna')
    if (table) assertIdentifier(table, 'tabla')

    const colRef = quoteColumnRef(table, column)

    if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
        return `${colRef} ${operator}`
    }

    const valueType = cond.valueType ?? 'literal'
    const value = cond.value

    if (valueType === 'param') {
        const paramName = String(value ?? '')
        assertIdentifier(paramName, 'parámetro')
        if (operator === 'BETWEEN' || operator === 'NOT BETWEEN') {
            throw new Error('BETWEEN con valueType=param no soportado.')
        }
        return `${colRef} ${operator} :${paramName}`
    }

    // literal
    if (operator === 'IN' || operator === 'NOT IN') {
        if (!Array.isArray(value) || value.length === 0) {
            throw new Error(`Operador ${operator} requiere un array.`)
        }
        const placeholders = value.map(v => ':' + registerLiteral(ctx, v))
        return `${colRef} ${operator} (${placeholders.join(', ')})`
    }

    if (operator === 'BETWEEN' || operator === 'NOT BETWEEN') {
        if (!Array.isArray(value) || value.length !== 2) {
            throw new Error(`Operador ${operator} requiere [from, to]`)
        }
        const p1 = registerLiteral(ctx, value[0])
        const p2 = registerLiteral(ctx, value[1])
        return `${colRef} ${operator} :${p1} AND :${p2}`
    }

    const p = registerLiteral(ctx, value)
    return `${colRef} ${operator} :${p}`
}

/* ───── GROUP BY / ORDER BY ───── */

function buildGroupBy(groupBy: GroupByField[]): string {
    const parts = groupBy.map(g => {
        assertIdentifier(g.column, 'columna')
        if (g.table) assertIdentifier(g.table, 'tabla')
        return quoteColumnRef(g.table ?? null, g.column)
    })
    return 'GROUP BY ' + parts.join(', ')
}

function buildOrderBy(orderBy: OrderByField[]): string {
    const parts = orderBy.map(o => {
        const dir = String(o.direction ?? 'asc').toLowerCase()
        assertIdentifier(o.column, 'columna')
        if (o.table) assertIdentifier(o.table, 'tabla')
        if (!VALID_DIRECTIONS.includes(dir)) {
            throw new Error(`Dirección inválida: ${dir}`)
        }
        return quoteColumnRef(o.table ?? null, o.column) + ' ' + dir.toUpperCase()
    })
    return 'ORDER BY ' + parts.join(', ')
}

/* ───── HELPERS ───── */

function assertIdentifier(id: string, kind: string): void {
    if (!IDENTIFIER_REGEX.test(id)) {
        throw new Error(`Identificador de ${kind} inválido: ${id}`)
    }
}

function quoteIdentifier(id: string): string {
    return '`' + id.replace(/`/g, '``') + '`'
}

function quoteColumnRef(table: string | null | undefined, column: string): string {
    if (column === '*') {
        return table ? quoteIdentifier(table) + '.*' : '*'
    }
    return table
        ? quoteIdentifier(table) + '.' + quoteIdentifier(column)
        : quoteIdentifier(column)
}

function parseQualifiedRef(ref: string): string {
    if (ref.includes('.')) {
        const [t, c] = ref.split('.', 2)
        assertIdentifier(t, 'tabla')
        assertIdentifier(c, 'columna')
        return quoteIdentifier(t) + '.' + quoteIdentifier(c)
    }
    assertIdentifier(ref, 'columna')
    return quoteIdentifier(ref)
}

function registerLiteral(ctx: { literalCounter: number; literalBindings: Record<string, unknown> }, value: unknown): string {
    ctx.literalCounter++
    const name = 'lit_' + ctx.literalCounter
    ctx.literalBindings[name] = value
    return name
}
