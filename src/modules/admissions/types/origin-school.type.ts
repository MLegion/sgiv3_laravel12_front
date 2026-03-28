export interface OriginSchoolType {
    id: number
    name: string
    shortName: string | null
    cct: string | null
    schoolLevel: string | null
    address: string | null
    geoSettlementId: number | null
    geoSettlement: {
        id: number
        postalCode: string
        colony: string
        city: string
        settlementType: string
        state: { id: number; code: string; name: string } | null
        municipality: { id: number; name: string } | null
    } | null
    phone: string | null
    email: string | null
    status: number
    createdAt: string | null
    updatedAt: string | null
}

export const SCHOOL_LEVEL_OPTIONS = [
    { value: 'preparatoria',  label: 'PREPARATORIA / BACHILLERATO' },
    { value: 'universidad',   label: 'UNIVERSIDAD' },
    { value: 'tecnico',       label: 'TÉCNICO SUPERIOR' },
    { value: 'normal',        label: 'NORMAL' },
    { value: 'otro',          label: 'OTRO' },
]

export const STATUS_OPTIONS = [
    { value: 1, label: 'ACTIVA' },
    { value: 0, label: 'INACTIVA' },
]
