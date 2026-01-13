import type { College } from './college'

export interface CollegeApiItem extends College {
    status: boolean
    deleted_at: string | null
    created_at: string
    updated_at: string
}

export interface CollegeListResponse {
    items: CollegeApiItem[]
}
