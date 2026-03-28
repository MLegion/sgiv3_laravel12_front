import type { CollegeType } from '@/modules/college/types/college.type'

export interface CampusType {
    id: number
    collegeId: number
    college?: CollegeType | null
    name: string
    shortName: string | null
    code: string | null
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    status: boolean
    createdAt: string
    updatedAt: string
}
