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

export interface AdvisingTeacherAssignmentRef {
    id: number
    groupId: number | null
    groupName: string | null
    shift: string | null
    teacherId: number | null
    teacherName: string | null
}

export interface AdvisingSessionItem {
    id: number
    advisingSessionId: number
    subjectId: number
    curriculumId: number | null
    teacherAssignmentId: number | null
    isRepeat: boolean
    isSpecial: boolean
    targetSemester: number | null
    studentPriority: number | null
    advisorStatus: AdvisorItemStatus
    replacementSubjectId: number | null
    hasOverrides: boolean
    overrideCodes: string[] | null
    overrideByUserId: number | null
    overrideByName: string | null
    overrideAt: string | null
    addedByUserId: number | null
    addedByName: string | null
    addedByRole: string | null
    subject: AdvisingSubjectRef | null
    replacementSubject: AdvisingSubjectRef | null
    teacherAssignment: AdvisingTeacherAssignmentRef | null
    createdAt?: string | null
    updatedAt?: string | null
}

export interface AdvisingSession {
    id: number
    studentAffiliationId: number
    studentId: number
    collegeAcademicPeriodId: number
    studyPlanId: number | null
    status: AdvisingStatus
    submittedAt: string | null
    reviewedAt: string | null
    reviewedBy: number | null
    rejectionReason: string | null
    reopenReason: string | null
    reopenedAt: string | null
    reopenedByUserId: number | null
    personalDataConfirmedAt: string | null
    student: { id: number; numControl?: string | null; fullName: string } | null
    reviewer: { id: number; name?: string | null; email?: string | null } | null
    period?: { id: number; name: string | null; shortName: string | null } | null
    items: AdvisingSessionItem[]
    createdAt?: string | null
    updatedAt?: string | null
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

export interface CurriculumOfferScheduleBlock {
    dayOfWeek: number | null
    date: string | null
    startTime: string
    endTime: string
}

export interface CurriculumOfferAssignment {
    id: number // teacher_assignment_id
    groupId: number | null
    groupName: string
    shift: string | null
    capacity: number | null
    teacherId: number | null
    teacherName: string | null
    schedule: CurriculumOfferScheduleBlock[]
}

export interface CurriculumOfferInfo {
    packageId: number
    numGroups: number
    isRepeat: boolean
    assignments: CurriculumOfferAssignment[]
}

export type CurriculumPassType = 'NORMAL' | 'REPITE' | 'ESPECIAL'

export interface CurriculumKardexInfo {
    passed: boolean
    grade: number | null
    passType: CurriculumPassType | null
    approvalType: { id: number; name: string; shortName: string | null } | null
}

export type CurriculumTrack = 'troncal' | 'specialty' | 'optional'

export interface CurriculumStatusEntry {
    curriculumId: number
    subjectId: number
    subject: AdvisingSubjectRef | null
    level: number
    period: number
    track: CurriculumTrack
    specialtyId: number | null
    optionalGroupId: number | null
    countsForStudent: boolean
    attempt: SubjectAttempt
    isOffered: boolean
    offer: CurriculumOfferInfo | null
    kardex: CurriculumKardexInfo | null
    minCreditsRequired: number | null
    prerequisiteIds: number[]
    corequisiteIds: number[]
}

export interface CurriculumAssignmentRef {
    id: number
    name: string
    shortName: string | null
    officialCode: string | null
}

export interface CurriculumPolicy {
    showOnlyEligible: boolean
    maxRepeatSubjects: number
    maxTotalCredits: number
    maxCreditsWithOneRepeat: number
    minTotalCredits: number
    minDisabledFromSemester: number
    socialServiceCreditsBonus: number
    enforceSpecialSubjects: boolean
    enforceScheduleConflict: boolean
    allowSubjectsOutsideCurriculum: boolean
}

export interface CurriculumStatus {
    studentAffiliationId?: number | null
    studyPlanId: number | null
    studyPlan: {
        id: number
        name: string
        careerName?: string | null
        careerShort?: string | null
        officialCode?: string | null
        startYear?: number | null
        periods?: number | null
    } | null
    studentCurrentPeriodNumber?: number | null
    repeatCount?: number
    hasMandatorySpecials?: boolean
    policy?: CurriculumPolicy
    creditsEarned?: number
    totalCredits?: number
    progressPercent?: number
    needsSpecialty?: boolean
    needsOptionalGroup?: boolean
    assignedSpecialty?: CurriculumAssignmentRef | null
    assignedOptionalGroup?: CurriculumAssignmentRef | null
    subjects: CurriculumStatusEntry[]
}

export interface ContactInfo {
    address: string | null
    geoSettlementId: number | null
    postalCode: string | null
    settlementName: string | null
    homePhone: string | null
    mobilePhone: string | null
    email: string | null
}

export interface GeoSettlement {
    id: number
    colony: string
    type: string | null
}

export interface GeoPostalCodeResponse {
    postalCode: string
    state: { id: number; name: string }
    municipality: { id: number; name: string }
    city: string | null
    settlements: GeoSettlement[]
}

export interface ProposedItemInput {
    subject_id: number
    curriculum_id?: number | null
    target_semester?: number | null
    student_priority?: number | null
    teacher_assignment_id?: number | null
}

export interface PolicyViolation {
    code: string
    message: string
    severity: 'error' | 'warning'
    subject_id?: number | null
    item_id?: number | null
    payload?: Record<string, unknown>
}
