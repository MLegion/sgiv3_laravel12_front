export interface ApplicantContact {
    id: number
    applicantId: number
    name: string
    firstSurname: string
    secondSurname: string | null
    relationship: string
    phone: string | null
    email: string | null
    isEmergencyContact: boolean
    createdAt?: string | null
    updatedAt?: string | null
}

export const RELATIONSHIP_OPTIONS = [
    { value: 'padre',        label: 'Padre' },
    { value: 'madre',        label: 'Madre' },
    { value: 'tutor_legal',  label: 'Tutor Legal' },
    { value: 'hermano',      label: 'Hermano/a' },
    { value: 'conyuge',      label: 'Cónyuge' },
    { value: 'otro',         label: 'Otro' },
]
