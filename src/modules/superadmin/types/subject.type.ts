import type { AuthUser } from '@/shared/types/user'
import type { College } from '@/shared/types/college'
import type { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum'

export interface SubjectType {
    id: number

    name: string
    shortName: string | null
    officialCode: string

    ht: number
    hp: number
    credits: number

    specialtyId: number | null
    optionalGroupId: number | null

    collegeId: number | null
    college?: College | null

    createdBy: number
    creator?: AuthUser | null

    approvedBy: number | null
    approver?: AuthUser | null

    approvedAt: string | null
    approvalStatus: ApprovalStatusEnum

    isActive: boolean

    createdAt: string
    updatedAt: string
}
