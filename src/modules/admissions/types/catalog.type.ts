export interface CatalogItem {
    id: number
    collegeId: number | null
    name: string
    createdAt?: string | null
    updatedAt?: string | null
    deletedAt?: string | null
}
