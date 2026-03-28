import type { BuildingType } from './building.type'

export interface PlaceType {
    id: number
    buildingId: number
    building?: BuildingType | null
    name: string
    shortName: string | null
    capacity: number
    resources: Record<string, unknown> | null
    status: boolean
    createdAt: string
    updatedAt: string
}
