import type { ApprovalStatusEnum } from '@/shared/enums/ApprovalStatus.enum'

export interface SpecialtyType {
    id: number

    /* ---------------------------------------------------------------------- */
    /* CORE DATA                                                               */
    /* ---------------------------------------------------------------------- */
    studyPlanId: number
    officialCode: string
    name: string
    shortName?: string
    periods: number
    startYear: number

    /* ---------------------------------------------------------------------- */
    /* RELATIONS                                                               */
    /* ---------------------------------------------------------------------- */
    career?: {
        id: number
        name: string
        shortName?: string
        officialCode?: string
    }

    /* ---------------------------------------------------------------------- */
    /* AUDIT / FLOW                                                            */
    /* ---------------------------------------------------------------------- */
    createdBy: number
    collegeId?: number | null

    approvedBy?: number | null
    approvedAt?: string | null
    approvalStatus: ApprovalStatusEnum

    isActive: boolean

    /* ---------------------------------------------------------------------- */
    /* TIMESTAMPS                                                              */
    /* ---------------------------------------------------------------------- */
    createdAt?: string
    updatedAt?: string
}
