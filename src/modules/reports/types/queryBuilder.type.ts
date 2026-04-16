/**
 * Tipos para la estructura del Query Builder visual (persistida en
 * data_access_objects.query_structure como JSON).
 *
 * Debe mantenerse sincronizado con el backend `SqlQueryGenerator` PHP.
 */

export type JoinType = 'inner' | 'left' | 'right'
export type OrderDirection = 'asc' | 'desc'
export type Conjunction = 'and' | 'or'

export type AggregateFunction = 'COUNT' | 'SUM' | 'AVG' | 'MAX' | 'MIN'

export type FilterOperator =
    | '='
    | '!='
    | '<>'
    | '>'
    | '>='
    | '<'
    | '<='
    | 'LIKE'
    | 'NOT LIKE'
    | 'IN'
    | 'NOT IN'
    | 'IS NULL'
    | 'IS NOT NULL'
    | 'BETWEEN'
    | 'NOT BETWEEN'

export type ValueType = 'literal' | 'param'

/* ───── FROM ───── */

export interface FromClause {
    table: string
    alias?: string | null
}

/* ───── JOINS ───── */

export interface JoinOn {
    left: string     // "alias.columna" (ej. "s.group_id")
    right: string    // "alias.columna" (ej. "g.id")
}

export interface JoinClause {
    type: JoinType
    table: string
    alias?: string | null
    on: JoinOn
}

/* ───── COLUMNS (SELECT) ───── */

export interface ColumnSelection {
    table?: string | null
    column: string                          // '*' para SELECT *
    alias?: string | null
    aggregate?: AggregateFunction | null
}

/* ───── WHERE / HAVING ───── */

export interface Condition {
    table?: string | null
    column: string
    operator: FilterOperator
    /**
     * - 'literal': el valor se convierte en parámetro anónimo `:lit_N` al generar el SQL
     * - 'param': referencia a un dao_parameter declarado (por nombre)
     */
    valueType: ValueType
    /**
     * - Si valueType='literal': string | number | boolean | array (para IN/BETWEEN)
     * - Si valueType='param': nombre del parámetro declarado
     * - Si operator es IS NULL / IS NOT NULL: null (se ignora)
     */
    value: unknown
}

export interface ConditionTree {
    conjunction: Conjunction
    conditions: Condition[]
}

/* ───── GROUP BY / ORDER BY ───── */

export interface GroupByField {
    table?: string | null
    column: string
}

export interface OrderByField {
    table?: string | null
    column: string
    direction: OrderDirection
}

/* ───── ESTRUCTURA COMPLETA ───── */

export interface QueryStructure {
    from: FromClause
    joins?: JoinClause[]
    columns?: ColumnSelection[]
    where?: ConditionTree
    groupBy?: GroupByField[]
    having?: ConditionTree
    orderBy?: OrderByField[]
    limit?: number | null
}

/* ───── DAO PARAMETER ───── */

export type ParameterSourceType = 'session' | 'request' | 'fixed'
export type ParameterDataType = 'int' | 'string' | 'date' | 'datetime' | 'bool' | 'float'

export interface DaoParameter {
    id?: number
    name: string                            // clave usada en :name del SQL
    source_type: ParameterSourceType
    source_key?: string | null
    data_type: ParameterDataType
    default_value?: string | null
    is_required: boolean
    position: number
}
