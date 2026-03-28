export interface OfferRequiredDocument {
    id: number
    academicOfferId: number
    documentTypeId: number
    documentType: { id: number; name: string; shortName: string } | null
    academicOffer: { id: number; careerId: number } | null
    isRequired: boolean
    order: number
    createdAt: string
    updatedAt: string
}
