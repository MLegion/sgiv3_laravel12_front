import type { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum'

export interface CareerType {
    id: number
    name: string
    shortName: string
    officialCode: string
    createdBy: number | null
    collegeId: number | null
    approvedBy: number | null
    approvedAt: string | null
    approvalStatus: ApprovalStatusEnum
    isActive: boolean
    createdAt?: string | null
    updatedAt?: string | null
    creator?: { id: number; name?: string; email?: string } | null
    createdByUser?: { id: number; name?: string; email?: string } | null
    approver?: { id: number; name?: string; email?: string } | null
    college?: { id: number; name?: string; shortName?: string } | null
}
