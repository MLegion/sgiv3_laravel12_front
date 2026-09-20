export interface TitulacionOption {
    id: number
    code: string
    name: string
    requires_residency: boolean
}

export interface JuryMember {
    id: number
    user_id: number
    teacher_id: number | null
    role: 'presidente' | 'secretario' | 'vocal' | 'suplente'
    user_name: string | null
    assigned_at: string | null
}

export interface TitulacionAct {
    id: number
    titulacion_record_id: number
    place_id: number | null
    place_name: string | null
    date: string
    start_time: string
    end_time: string
    status: 'scheduled' | 'done' | 'cancelled'
    outcome: 'aprobado' | 'suspendido' | 'aplazado' | null
    notes: string | null
    student_name?: string
    num_control?: string
    project_title?: string | null
    career_name?: string | null
    option_name?: string | null
    my_role?: string
}

export interface TitulacionRecord {
    id: number
    student_id: number
    student_name: string
    num_control: string | null
    college_id: number
    career_id: number | null
    career_name: string | null
    titulacion_option_id: number | null
    option_name: string | null
    option_code: string | null
    option_requires_residency?: boolean
    residency_id: number | null
    project_title: string | null
    english_b1: boolean
    english_b1_at: string | null
    no_adeudos: boolean
    status: 'registered' | 'scheduled' | 'presented' | 'titulado' | 'dropped'
    period_name: string | null
    jury?: JuryMember[]
    acts?: TitulacionAct[]
}

export interface TitulacionRoom {
    id: number
    name: string
    short_name: string | null
    capacity: number | null
    is_titulacion_room: boolean
    building_name: string | null
}

export interface EligibleResidency {
    id: number
    career_id: number | null
    career_name: string | null
    project_title: string | null
    concluded_at: string | null
}
