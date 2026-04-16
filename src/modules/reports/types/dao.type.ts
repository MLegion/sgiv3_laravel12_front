import type { QueryStructure, DaoParameter } from './queryBuilder.type'

export type DaoType = 1 | 2 | 3  // 1=SQL, 2=REQUEST, 3=JSON

export interface DataAccessObject {
    id: number
    college_id: number | null
    name: string
    description: string | null
    type: DaoType
    data_source: string
    /**
     * Estructura del Query Builder visual (solo type=1 SQL).
     * Si está presente, el backend regenera data_source a partir de ésta al guardar.
     */
    query_structure?: QueryStructure | null
    /**
     * Parámetros declarados del DAO. Se sincronizan al guardar el DAO.
     */
    parameters?: DaoParameter[]
    status?: boolean
    created_at?: string
    updated_at?: string
}

/**
 * Payload para crear/actualizar un DAO.
 * Frontend → backend.
 */
export interface DataAccessObjectPayload {
    name: string
    description?: string | null
    type: DaoType
    /** Opcional cuando se envía query_structure — el backend genera el SQL. */
    data_source?: string
    query_structure?: QueryStructure | null
    parameters?: DaoParameter[]
    status?: boolean
    fields?: string | null
}

