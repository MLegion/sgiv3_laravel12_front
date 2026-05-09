export type AttendanceStatus = 'PENDING' | 'PRESENT' | 'ABSENT' | 'INCOMPLETE'

export interface AttendanceCounts {
    PENDING: number
    PRESENT: number
    ABSENT: number
    INCOMPLETE: number
}

export interface ProctorSessionListItem {
    id: number
    date: string
    startTime: string
    endTime: string
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'SUSPENDED' | 'CANCELLED' | 'RESCHEDULED'
    capacity: number
    place: { id: number; name: string; shortName: string | null } | null
    academicPeriod: { id: number; name: string; shortName: string } | null
    startedAt: string | null
    closedAt: string | null
    pausedAt: string | null
    pauseReason: string | null
    suspendedAt: string | null
    suspendReason: string | null
    assignedCount: number
    attendanceCounts: AttendanceCounts
}

export interface ProctorSessionsResponse {
    today: ProctorSessionListItem[]
    upcoming: ProctorSessionListItem[]
    past: ProctorSessionListItem[]
}

export interface CheckInResponse {
    alreadyPresent: boolean
    assignmentId: number
    seatNumber: number | null
    attendedAt: string | null
    applicant: {
        id: number
        names: string
        firstSurname: string
        secondSurname: string | null
        preApplicationFolio: string | null
    } | null
}
