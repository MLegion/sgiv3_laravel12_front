export type ExamSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'

export interface ExamSession {
    id: number
    collegeId: number
    academicPeriodId: number
    placeId: number
    date: string
    startTime: string
    endTime: string
    capacity: number
    status: ExamSessionStatus
    parentSessionId: number | null
    rescheduleReason: string | null
    notes: string | null
    createdBy: number | null
    updatedBy: number | null
    createdAt: string | null
    updatedAt: string | null
    deletedAt: string | null
    place: {
        id: number
        name: string
        shortName: string | null
        capacity: number
        buildingId: number
    } | null
    academicPeriod: { id: number; name: string; shortName: string } | null
    assignedCount: number
    proctorsCount: number
}

/**
 * Conflicto contra una clase escolarizada (la clase de ese día se pierde,
 * se notifica al jefe de carrera vía warnings).
 */
export interface ScolarizedConflict {
    scheduleId: number
    teacherAssignmentId: number | null
    careerId: number | null
    date: string | null
    dayOfWeek: number | null
    startTime: string
    endTime: string
    placeId: number
    modalityId: number | null
    modalityName: string | null
    usesSpecificDates: boolean
    subject: string | null
    teacher: string | null
    label: string | null
}

/**
 * Conflicto contra una clase semi-escolarizada (requiere reprogramación
 * parcial: nueva ranura).
 */
export interface SemiSchoolarizedConflict extends ScolarizedConflict {}

export interface OtherConflict {
    sourceType: string
    sourceId: number
    placeId: number
    date: string | null
    dayOfWeek: number | null
    startTime: string
    endTime: string
    label: string | null
    metadata: Record<string, any>
}

export interface ExamConflictReport {
    scolarized: ScolarizedConflict[]
    semiSchoolarized: SemiSchoolarizedConflict[]
    complementary: OtherConflict[]
    otherExams: OtherConflict[]
    other: OtherConflict[]
}

export interface PartialOverrideInput {
    newDate: string
    newStartTime: string
    newEndTime: string
    newPlaceId: number
    notes?: string | null
}

export interface ExamSessionPayload {
    academic_period_id: number
    place_id: number
    date: string
    start_time: string
    capacity: number
    duration_minutes?: number | null
    notes?: string | null
    confirm_conflicts?: boolean
    partial_overrides?: Record<number, PartialOverrideInput>
}

export interface RescheduleExamSessionPayload extends ExamSessionPayload {
    reason: string
}

export interface PreviewConflictsPayload {
    place_id: number
    date: string
    start_time: string
    duration_minutes?: number | null
    exclude_session_id?: number | null
    academic_period_id?: number | null
}

export interface PreviewConflictsResponse {
    startTime: string
    endTime: string
    durationMinutes: number
    hasConflicts: boolean
    conflicts: ExamConflictReport
}
