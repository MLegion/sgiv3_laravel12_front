export interface SchoolCalendar {
    id: number
    collegeAcademicPeriodId: number
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
    isPerModality: boolean
    maxOccurrences: number
    dependencyId: number | null
    visible: boolean
    image: string | null
    sortOrder: number
    isActive: boolean
    createdAt: string | null
    updatedAt: string | null
}

export interface SchoolCalendarEventModalitySnapshot {
    id: number
    modality_type?: { id: number, name: string, short_name?: string | null } | null
    campus?: { id: number, name: string } | null
}

export interface SchoolCalendarEvent {
    id: number
    schoolCalendarId: number
    eventTypeId: number
    startDate: string
    endDate: string
    label: string | null
    modalityId: number | null
    modality: SchoolCalendarEventModalitySnapshot | null
    eventType: SchoolCalendarEventType | null
    createdAt: string | null
    updatedAt: string | null
}

export const DAY_NAMES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
export const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
