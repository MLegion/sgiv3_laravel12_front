export interface AcademicLoadConfigHistory {
    id: number
    academicLoadConfigId: number
    changedByUserId: number | null
    phase: string
    oldValue: boolean
    newValue: boolean
    source: 'manual' | 'calendar_sync'
    isExceptional: boolean
    reason: string | null
    changedByUser: {
        id: number
        name: string | null
        email: string | null
    } | null
    createdAt: string | null
}

export interface AcademicLoadConfig {
    id: number
    collegeAcademicPeriodId: number
    modalityId: number
    status: 'draft' | 'active' | 'closed'
    phasePackage: boolean
    phasePackageValidation: boolean
    phaseRequest: boolean
    phaseAssignment: boolean
    phaseSchedule: boolean
    phaseSchedulePublished: boolean
    lastSyncedAt: string | null
    collegeAcademicPeriod: {
        id: number
        collegeId: number
        academicPeriodId: number
        actualStartDate: string
        actualEndDate: string
        status: string
        academicPeriod: {
            id: number
            name: string
            shortName: string
        } | null
    } | null
    modality: {
        id: number
        campusId: number
        modalityType: {
            id: number
            name: string
            shortName: string
        } | null
        status: boolean
    } | null
    history: AcademicLoadConfigHistory[] | null
    createdAt: string | null
    updatedAt: string | null
}

export const PHASES = [
    { key: 'phase_package',             label: 'PAQUETE DE MATERIAS',     order: 1 },
    { key: 'phase_package_validation',  label: 'VALIDACIÓN DE PAQUETE',   order: 2 },
    { key: 'phase_request',             label: 'SOLICITUD DE DOCENTES',   order: 3 },
    { key: 'phase_assignment',          label: 'ASIGNACIÓN DE MATERIAS',  order: 4 },
    { key: 'phase_schedule',            label: 'CREACIÓN DE HORARIOS',    order: 5 },
    { key: 'phase_schedule_published',  label: 'PUBLICACIÓN DE HORARIOS', order: 6 },
] as const

export type PhaseKey =
    | 'phase_package'
    | 'phase_package_validation'
    | 'phase_request'
    | 'phase_assignment'
    | 'phase_schedule'
    | 'phase_schedule_published'

export const STATUS_OPTIONS = [
    { value: 'draft',  label: 'BORRADOR' },
    { value: 'active', label: 'ACTIVO' },
    { value: 'closed', label: 'CERRADO' },
]
