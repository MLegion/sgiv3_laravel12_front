export interface ModalityType {
    id: number
    campusId: number
    campus?: Record<string, unknown> | null
    modalityTypeId: number
    modalityType?: Record<string, unknown> | null
    status: boolean
}

export interface AcademicOfferType {
    id: number
    modalityId: number
    modality?: ModalityType | null
    careerId: number
    career?: Record<string, unknown> | null
    status: number
    createdAt: string
    updatedAt: string
}
