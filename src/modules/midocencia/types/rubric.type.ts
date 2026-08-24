export type RubricStatus = 'draft' | 'published'

export interface RubricVersion {
    id: number
    collegeId: number | null
    name: string
    status: RubricStatus
    publishedBy: number | null
    publishedAt: string | null
    createdAt: string | null
    updatedAt: string | null
}

export interface RubricProduct {
    id: number
    name: string
    hoursMin: number | null
    hoursMax: number | null
    sortOrder: number
}

export interface RubricEvidence {
    id: number
    productId: number | null
    name: string
    hoursMin: number | null
    hoursMax: number | null
    sortOrder: number
}

export interface RubricCriterion {
    id: number
    name: string
    hoursMin: number
    hoursMax: number
    criterionKey: string | null
    sortOrder: number
    products: RubricProduct[]
    evidences: RubricEvidence[]
}

export interface RubricRubro {
    id: number
    name: string
    sortOrder: number
    criteria: RubricCriterion[]
}

export interface RubricTree {
    rubric: RubricVersion
    rubros: RubricRubro[]
}

export interface RubroOption {
    id: number
    name: string
    sortOrder: number
}
