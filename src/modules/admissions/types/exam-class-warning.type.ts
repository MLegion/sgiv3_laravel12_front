export interface ExamClassWarning {
    id: number
    examSessionId: number
    academicScheduleId: number
    teacherAssignmentId: number
    careerId: number | null
    acknowledgedAt: string | null
    acknowledgedByUserId: number | null
    createdAt: string | null
    updatedAt: string | null
    examSession: {
        id: number
        date: string
        startTime: string
        endTime: string
        placeId: number
    } | null
    career: { id: number; name: string; shortName: string | null } | null
    teacher: { id: number; fullName: string | null } | null
    subject: { id: number; name: string } | null
}
