export interface Applicant {
    id: number
    collegeId: number | null
    college: { id: number; name: string; shortName: string | null } | null
    offerOption1Id: number | null
    offerOption2Id: number | null
    offerOption3Id: number | null
    offerOption1: { id: number; careerId: number; career?: { name: string } } | null
    offerOption2: { id: number; careerId: number; career?: { name: string } } | null
    offerOption3: { id: number; careerId: number; career?: { name: string } } | null
    originSchoolId: number | null
    originSchool: { id: number; name: string } | null
    academicPeriodId: number
    academicPeriod: { id: number; name: string; shortName: string } | null
    names: string
    firstSurname: string
    secondSurname: string | null
    email: string
    phone: string | null
    curp: string | null
    status: number
    applicationFolio: string | null
    entranceScore: string | null
    photoPath: string | null
    userId: number | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface ApplicantStatus {
    id: number
    code: string
    label: string
    description: string
    color: string
}

export const STATUS_OPTIONS = [
    { value: 0, label: 'CANCELADO' },
    { value: 1, label: 'POR VERIFICAR' },
    { value: 2, label: 'PROSPECTO' },
    { value: 3, label: 'PREFICHA' },
    { value: 4, label: 'FICHA' },
    { value: 5, label: 'ADMITIDO' },
    { value: 6, label: 'INSCRITO' },
]

export const STATUS_CLASSES: Record<number, string> = {
    0: 'bg-red-100 text-red-700',
    1: 'bg-yellow-100 text-yellow-700',
    2: 'bg-slate-100 text-slate-600',
    3: 'bg-orange-100 text-orange-700',
    4: 'bg-blue-100 text-blue-700',
    5: 'bg-green-100 text-green-700',
    6: 'bg-emerald-100 text-emerald-700',
}
