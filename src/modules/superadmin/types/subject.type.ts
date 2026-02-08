import type { UserType } from '@/modules/user/types/user.type'
import type { CollegeType } from '@/modules/college/types/college.type'

export interface SubjectType {
    id: number

    name: string
    shortName: string | null
    officialCode: string

    ht: number
    hp: number
    credits: number

    specialtyId: number | null
    optionalGroupId: number | null

    collegeId: number | null
    college?: CollegeType | null

    createdBy: number
    creator?: UserType | null

    approvedBy: number | null
    approver?: UserType | null

    approvedAt: string | null
    approvalStatus: string

    isActive: boolean

    createdAt: string
    updatedAt: string
}
