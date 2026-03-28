import type { AcademicOfferType } from './academic-offer.type'

export interface AcademicOfferStudyPlanType {
    id: number
    academicOfferId: number
    academicOffer?: AcademicOfferType | null
    studyPlanId: number
    studyPlan?: Record<string, unknown> | null
    status: boolean
    createdAt: string
    updatedAt: string
}
