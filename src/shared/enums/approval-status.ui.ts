import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum.ts'
import type { ApprovalStatusUI } from '@/shared/enums/approval-status.types'

export const ApprovalStatusUIMap: Record<
    ApprovalStatusEnum,
    ApprovalStatusUI
> = {
    [ApprovalStatusEnum.DRAFT]: {
        label: 'BORRADOR',
        icon: 'document-text',
        color: 'text-slate-600 bg-slate-100',
    },

    [ApprovalStatusEnum.PENDING]: {
        label: 'PENDIENTE',
        icon: 'clock',
        color: 'text-amber-700 bg-amber-100',
    },

    [ApprovalStatusEnum.APPROVED]: {
        label: 'APROBADO',
        icon: 'check-circle',
        color: 'text-green-700 bg-green-100',
    },

    [ApprovalStatusEnum.REJECTED]: {
        label: 'RECHAZADO',
        icon: 'x-circle',
        color: 'text-red-700 bg-red-100',
    },
}
