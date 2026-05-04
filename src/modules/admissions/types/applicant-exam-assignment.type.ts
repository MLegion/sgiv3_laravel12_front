export type AssignmentMethod = 'AUTO' | 'MANUAL'

export type AutoDistributeStrategy =
    | 'BY_LASTNAME'
    | 'BY_FOLIO'
    | 'BY_REGISTRATION_DATE'
    | 'RANDOM'

export interface ApplicantExamAssignment {
    id: number
    applicantId: number
    examSessionId: number
    seatNumber: number | null
    assignedByUserId: number | null
    assignmentMethod: AssignmentMethod
    attendanceStatus?: 'PENDING' | 'PRESENT' | 'ABSENT' | 'INCOMPLETE'
    attendedAt?: string | null
    attendedByUserId?: number | null
    createdAt: string | null
    updatedAt: string | null
    applicant: {
        id: number
        names: string
        firstSurname: string
        secondSurname: string | null
        preApplicationFolio: string | null
        campusId: number | null
    } | null
    examSession: {
        id: number
        date: string
        startTime: string
        endTime: string
        placeId: number
    } | null
}

export interface AssignApplicantPayload {
    applicant_id: number
    seat_number?: number | null
}

export interface AutoDistributePayload {
    academic_period_id: number
    strategy?: AutoDistributeStrategy
    session_ids?: number[] | null
}

export interface BulkReassignPayload {
    assignment_ids: number[]
    new_exam_session_id: number
}
