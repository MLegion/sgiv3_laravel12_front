/**
 * Tipos para el endpoint GET /api/v1/reports/schema
 * que devuelve la estructura de la base de datos disponible para el Query Builder.
 */

export type ColumnType = 'int' | 'float' | 'string' | 'date' | 'datetime' | 'time' | 'bool' | 'json' | 'other'

export interface ColumnSchema {
    name: string
    type: ColumnType
    rawType: string    // MySQL original: int/varchar/decimal/etc
    nullable: boolean
    primary: boolean
}

export interface RelationSchema {
    type: 'belongsTo'
    foreignKey: string
    references: {
        table: string
        column: string
    }
}

export interface TableSchema {
    name: string                    // nombre real en la BD
    label: string                   // "Teacher Assignments" (humanizado)
    columns: ColumnSchema[]
    relations: RelationSchema[]
}

export interface SchemaResponse {
    tables: TableSchema[]
}
