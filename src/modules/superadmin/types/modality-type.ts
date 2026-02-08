export interface ModalityType {
    id: number
    name: string
    shortName: string
    config: Record<string, any>
    isActive: boolean
    createdAt?: string
    updatedAt?: string
}
