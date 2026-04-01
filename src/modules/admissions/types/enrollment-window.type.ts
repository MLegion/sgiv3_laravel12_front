export interface EnrollmentWindow {
    id: number
    collegeId: number
    academicPeriodId: number | null
    academicPeriod: { id: number; name: string; shortName: string } | null
    name: string
    startsAt: string
    endsAt: string
    isActive: boolean
    createdAt: string | null
    updatedAt: string | null
    deletedAt: string | null
}
