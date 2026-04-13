export interface ComplementaryHourType {
    id: number
    collegeId: number | null
    name: string
    shortName: string
    description: string | null
    countsAsTeaching: boolean
    color: string | null
    sortOrder: number
    status: boolean
    createdAt?: string | null
    updatedAt?: string | null
}

export interface ComplementaryHourTypeForm {
    name: string
    shortName: string
    description: string
    countsAsTeaching: boolean
    color: string
    sortOrder: number
    status: boolean
}

export function emptyForm(): ComplementaryHourTypeForm {
    return {
        name: '',
        shortName: '',
        description: '',
        countsAsTeaching: false,
        color: '',
        sortOrder: 0,
        status: true,
    }
}
