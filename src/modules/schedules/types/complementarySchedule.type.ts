import type { SchedulePlace, ScheduleTeacher } from './academicSchedule.type'

export interface ComplementaryHourTypeRef {
    id: number
    name: string
    shortName: string | null
}

export interface ComplementarySchedule {
    id: number
    collegeAcademicPeriodId: number
    teacherId: number
    teacher: ScheduleTeacher | null
    complementaryHourTypeId: number
    complementaryHourType: ComplementaryHourTypeRef | null
    placeId: number
    place: SchedulePlace | null
    dayOfWeek: number | null
    date: string | null
    startTime: string   // HH:MM
    endTime: string     // HH:MM
    notes: string | null
    createdBy: number | null
    updatedBy: number | null
    createdAt: string | null
    updatedAt: string | null
}

export interface ComplementaryScheduleInput {
    college_academic_period_id: number
    teacher_id: number
    complementary_hour_type_id: number
    place_id: number
    day_of_week: number | null
    date: string | null
    start_time: string
    end_time: string
    notes: string | null
}
