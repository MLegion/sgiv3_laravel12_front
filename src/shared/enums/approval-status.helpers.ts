import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum.ts'
import { ApprovalStatusUIMap } from '@/shared/enums/approval-status.ui'
import type { ApprovalStatusUI } from '@/shared/enums/approval-status.types'

export function getApprovalStatusUI(
    status: ApprovalStatusEnum
): ApprovalStatusUI {
    return ApprovalStatusUIMap[status]
}
