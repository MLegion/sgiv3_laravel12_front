export type AcademicPeriodStatus = 'draft' | 'planned' | 'active' | 'closed' | 'archived'

export interface AcademicPeriod {
    id: number
    previousPeriodId: number | null
    name: string
    shortName: string
    suggestedStartDate: string
    suggestedEndDate: string
    status: AcademicPeriodStatus
    statusLabel: string
    createdAt?: string
    updatedAt?: string
}

export const ACADEMIC_PERIOD_STATUS_OPTIONS = [
    { value: 'draft',    label: 'En Planeación' },
    { value: 'planned',  label: 'Planeado' },
    { value: 'active',   label: 'Activo / En Curso' },
    { value: 'closed',   label: 'Cerrado / Lectura' },
    { value: 'archived', label: 'Histórico / Archivado' },
]

export const ACADEMIC_PERIOD_STATUS_CLASSES: Record<AcademicPeriodStatus, string> = {
    draft:    'bg-slate-100 text-slate-600',
    planned:  'bg-blue-100 text-blue-700',
    active:   'bg-green-100 text-green-700',
    closed:   'bg-yellow-100 text-yellow-700',
    archived: 'bg-indigo-100 text-indigo-700',
}
