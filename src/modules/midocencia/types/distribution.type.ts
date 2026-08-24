import type { RubricTree } from './rubric.type'

export type RequestStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface LockedRow {
    rubricCriterionId: number
    hours: number
    sourceAssignmentIds: number[]
    subjects: string[]
}

export interface Budget {
    plazaHours: number | null
    plazaAssigned: boolean
    frontOfGroupHours: number
    dischargeHours: number | null
    lockedRows: LockedRow[]
    unmappedDischarge: Array<{ teacherAssignmentId: number; subjectName: string; dischargeType: string; hours: number }>
}

export interface RequestDetail {
    id: number
    rubricCriterionId: number
    hours: number
    selectedProducts: number[]
    selectedEvidences: number[]
    origin: 'teacher' | 'career_manager_assignment'
    locked: boolean
    sourceTeacherAssignmentId: number | null
}

export interface DistributionRequest {
    id: number
    teacherId: number
    collegeAcademicPeriodId: number
    rubricId: number | null
    status: RequestStatus
    budgetHours: number
    folio: string | null
    approvedBy: number | null
    submittedAt: string | null
    approvedAt: string | null
    rejectedReason: string | null
    scheduleStatus: 'pending' | 'submitted' | 'approved'
    scheduleSubmittedAt: string | null
    scheduleApprovedAt: string | null
    scheduleRejectedReason: string | null
    details: RequestDetail[]
}

export interface DistributionPayload {
    collegeAcademicPeriodId: number
    budget: Budget
    rubric: { id: number; name: string; status: string } | null
    tree: RubricTree | null
    request: DistributionRequest | null
    editable: boolean
}
