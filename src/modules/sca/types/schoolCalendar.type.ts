export interface SchoolCalendarDate {
    id: number
    schoolCalendarId: number
    date: string
    dayOfWeek: number
    isActive: boolean
    label: string | null
    createdAt: string | null
    updatedAt: string | null
}

export interface SchoolCalendar {
    id: number
    collegeAcademicPeriodId: number
    modalityId: number
    generationStrategy: 'weekday_range' | 'manual'
    config: { days_of_week?: number[] } | null
    status: 'draft' | 'published'
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
    dates: SchoolCalendarDate[] | null
    createdAt: string | null
    updatedAt: string | null
}

export interface SchoolCalendarHoliday {
    id: number
    collegeAcademicPeriodId: number
    date: string
    name: string
    createdAt: string | null
    updatedAt: string | null
}

export const STRATEGY_OPTIONS = [
    { value: 'weekday_range', label: 'RANGO DE DÍAS (AUTOMÁTICO)' },
    { value: 'manual', label: 'SELECCIÓN MANUAL' },
]

export const STATUS_OPTIONS = [
    { value: 'draft', label: 'BORRADOR' },
    { value: 'published', label: 'PUBLICADO' },
]

export interface SchoolCalendarEventType {
    id: number
    name: string
    shortName: string
    color: string
    excludesClasses: boolean
    isHoliday: boolean
    maxOccurrences: number
    dependencyId: number | null
    visible: boolean
    image: string | null
    sortOrder: number
    isActive: boolean
    createdAt: string | null
    updatedAt: string | null
}

export interface SchoolCalendarEvent {
    id: number
    schoolCalendarId: number
    eventTypeId: number
    startDate: string
    endDate: string
    label: string | null
    eventType: SchoolCalendarEventType | null
    createdAt: string | null
    updatedAt: string | null
}

export const DAY_NAMES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
export const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
