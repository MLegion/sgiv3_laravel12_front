import type { College } from '@/shared/types/college'

export interface CampusType {
    id: number
    collegeId: number
    college?: College | null
    name: string
    shortName: string | null
    code: string | null
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    status: boolean
    geoSettlement?: {
        id: number
        postalCode?: string
        municipality?: { id: number; name: string } | null
        state?: { id: number; code: string; name: string } | null
        colony?: string
    } | null
    createdAt: string
    updatedAt: string
}
