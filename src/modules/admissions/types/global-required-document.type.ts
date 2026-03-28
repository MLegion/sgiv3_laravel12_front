export interface GlobalRequiredDocument {
    id: number
    documentTypeId: number
    documentType: { id: number; name: string; shortName: string } | null
    isRequired: boolean
    order: number
    createdAt: string
    updatedAt: string
}
