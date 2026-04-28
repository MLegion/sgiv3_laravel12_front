import type { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum'
import type { PeriodTypeEnum } from '@/shared/enums/period-type.enum'

export interface StudyPlanType {
    id: number

    /* ---------------------------------------------------------------------- */
    /* CORE DATA                                                               */
    /* ---------------------------------------------------------------------- */
    careerId: number
    officialCode: string
    periodType: PeriodTypeEnum
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

    creator?: { id: number; name?: string; email?: string } | null
    approver?: { id: number; name?: string; email?: string } | null
    studyPlan?: { id: number; name?: string; officialCode?: string } | null

    /* ---------------------------------------------------------------------- */
    /* TIMESTAMPS                                                              */
    /* ---------------------------------------------------------------------- */
    createdAt?: string
    updatedAt?: string
}
