export interface Applicant {
    id: number
    academicOfferId: number
    academicPeriodId: number
    academicOffer: { id: number; careerId: number; career?: { name: string } } | null
    academicPeriod: { id: number; name: string; shortName: string } | null
    names: string
    firstSurname: string
    secondSurname: string | null
    email: string
    phone: string | null
    curp: string | null
    status: number
    applicationFolio: string | null
    originSchool: string | null
    entranceScore: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export const STATUS_OPTIONS = [
    { value: 0, label: 'CANCELADO' },
    { value: 1, label: 'PROSPECTO' },
    { value: 2, label: 'ASPIRANTE' },
    { value: 3, label: 'ADMITIDO' },
    { value: 4, label: 'INSCRITO' },
]

export const STATUS_CLASSES: Record<number, string> = {
    0: 'bg-red-100 text-red-700',
    1: 'bg-slate-100 text-slate-600',
    2: 'bg-blue-100 text-blue-700',
    3: 'bg-green-100 text-green-700',
    4: 'bg-emerald-100 text-emerald-800',
}
