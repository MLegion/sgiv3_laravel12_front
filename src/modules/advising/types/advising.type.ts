export type AdvisingStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
export type AdvisorItemStatus = 'proposed' | 'accepted' | 'rejected' | 'replaced'
export type SubjectAttempt = 'normal' | 'repite' | 'especial' | 'aprobada'
export type AdvisingPhase = 'phase_advising' | 'phase_enrollment' | 'phase_add_drop'

export interface AdvisingSubjectRef {
    id: number
    name: string
    code?: string | null
    credits?: number | null
}

export interface AdvisingSessionItem {
    id: number
    advisingSessionId: number
    subjectId: number
    curriculumId: number | null
    isRepeat: boolean
    isSpecial: boolean
    targetSemester: number | null
    studentPriority: number | null
    advisorStatus: AdvisorItemStatus
    advisorNotes: string | null
    replacementSubjectId: number | null
    hasOverrides: boolean
    subject: AdvisingSubjectRef | null
    replacementSubject: AdvisingSubjectRef | null
    createdAt?: string | null
    updatedAt?: string | null
}

export interface AdvisingSession {
    id: number
    studentId: number
    collegeAcademicPeriodId: number
    studyPlanId: number | null
    status: AdvisingStatus
    submittedAt: string | null
    reviewedAt: string | null
    reviewedBy: number | null
    studentNotes: string | null
    advisorNotes: string | null
    rejectionReason: string | null
    student: { id: number; numControl?: string | null; fullName: string } | null
    reviewer: { id: number; name?: string | null; email?: string | null } | null
    items: AdvisingSessionItem[]
    createdAt?: string | null
    updatedAt?: string | null
}

export interface AdvisingAuditLogEntry {
    id: number
    advisingSessionId: number
    advisingSessionItemId: number | null
    action: string
    actorId: number | null
    actorRole: string | null
    payload: Record<string, unknown>
    createdAt: string | null
    actor: { id: number; name?: string | null; email?: string | null } | null
}

export interface KardexAttempt {
    period_id: number | null
    period_short: string | null
    period_full: string | null
    number: number | null
}

export interface KardexRow {
    id: number
    subjectId: number
    subject: AdvisingSubjectRef | null
    grade: number | null
    passed: boolean
    approvalType: { id: number; name: string; code?: string | null } | null
    attempts: KardexAttempt[]
}

export interface CurriculumStatusEntry {
    curriculumId: number
    subjectId: number
    subject: AdvisingSubjectRef | null
    level: number
    period: number
    isOptional: boolean
    attempt: SubjectAttempt
    prerequisiteIds: number[]
    corequisiteIds: number[]
}

export interface CurriculumStatus {
    studyPlanId: number | null
    studyPlan: { id: number; name: string } | null
    subjects: CurriculumStatusEntry[]
}

export interface ProposedItemInput {
    subject_id: number
    curriculum_id?: number | null
    target_semester?: number | null
    student_priority?: number | null
    group_id?: number | null
}

export interface PolicyViolation {
    code: string
    message: string
    severity: 'error' | 'warning'
    subject_id?: number | null
    item_id?: number | null
    payload?: Record<string, unknown>
}
