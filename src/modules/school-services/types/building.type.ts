import type { CampusType } from './campus.type'

export interface BuildingType {
    id: number
    campusId: number
    campus?: CampusType | null
    name: string
    shortName: string | null
    description: string | null
    status: boolean
    createdAt: string
    updatedAt: string
}
