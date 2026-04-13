export interface SchedulePlace {
    id: number
    name: string
    shortName: string | null
    capacity: number
    isValidable: boolean
}

export interface ScheduleTeacher {
    id: number | null
    name: string | null
    isVacancy: boolean
}

export interface ScheduleSubject {
    id: number
    name: string
    shortName?: string | null
    officialCode: string | null
    ht: number
    hp: number
}

export interface ScheduleGroup {
    id: number
    name: string
    shift: string | null
    capacity: number
}

export interface ScheduleCareer {
    id: number
    name: string
    officialCode: string | null
}

export interface ScheduleTeacherAssignment {
    id: number
    teacher: ScheduleTeacher
    subject: ScheduleSubject | null
    group: ScheduleGroup | null
}

export interface AcademicSchedule {
    id: number
    teacherAssignmentId: number
    placeId: number
    dayOfWeek: number | null
    date: string | null
    startTime: string   // HH:MM
    endTime: string     // HH:MM
    createdBy: number | null
    updatedBy: number | null
    teacherAssignment: ScheduleTeacherAssignment | null
    place: SchedulePlace | null
    createdAt: string | null
    updatedAt: string | null
}

export interface AssignableAssignment {
    id: number
    teacher: ScheduleTeacher
    subject: ScheduleSubject | null
    group: ScheduleGroup | null
    career: ScheduleCareer | null
    totalMinutes: number
    assignedMinutes: number
    remainingMinutes: number
    isComplete: boolean
    usesDates: boolean
    blockDurationMinutes: number
    // Solo presentes cuando usesDates = true
    sessionsCount?: number
    assignedSessions?: number
    remainingSessions?: number
}

export const DAY_LABELS: Record<number, string> = {
    1: 'LUN',
    2: 'MAR',
    3: 'MIÉ',
    4: 'JUE',
    5: 'VIE',
    6: 'SÁB',
    7: 'DOM',
}

export const DAY_LABELS_FULL: Record<number, string> = {
    1: 'LUNES',
    2: 'MARTES',
    3: 'MIÉRCOLES',
    4: 'JUEVES',
    5: 'VIERNES',
    6: 'SÁBADO',
    7: 'DOMINGO',
}

export function formatMinutes(total: number): string {
    const h = Math.floor(total / 60)
    const m = total % 60
    return m === 0 ? `${h}h` : `${h}h ${m}m`
}
