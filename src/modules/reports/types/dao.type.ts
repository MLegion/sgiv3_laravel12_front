export type DaoType = 1 | 2 | 3  // 1=SQL, 2=REQUEST, 3=JSON

export interface DataAccessObject {
    id: number
    college_id: number | null
    name: string
    description: string | null
    type: DaoType
    data_source: string
    created_at: string
    updated_at: string
}
