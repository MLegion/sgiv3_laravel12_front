export interface CareerType {
    id: number
    name: string
    shortName: string
    officialCode: string
    createdBy: number | null,
    collegeId: number | null,
    approvedBy: number | null,
    approvedAt: string | null,
    approvalStatus: string | null,
    isActive: boolean
}
