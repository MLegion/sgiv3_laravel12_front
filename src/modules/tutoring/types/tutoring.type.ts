export interface TutoringTutee {
    id: number
    student_id: number
    status: string
    added_manually: boolean
    num_control: string | null
    student_name: string
}

export interface TutoringAssignment {
    id: number
    scope: 'grupal' | 'individual'
    status: 'active' | 'closed'
    plan: string | null
    college_id: number
    career_id: number | null
    group_id: number | null
    tutor_user_id: number
    tutor_name: string | null
    career_name: string | null
    group_name: string | null
    period_name: string | null
    college_academic_period_id: number
    tutees: TutoringTutee[]
}

export interface TutoringAssignmentRow {
    id: number
    scope: string
    status: string
    tutor_name: string | null
    career_name: string | null
    group_name: string | null
    period_name: string | null
    tutees_count: number
}

export interface TutoringSession {
    id: number
    assignment_id: number
    type: 'grupal' | 'individual'
    student_id: number | null
    session_date: string | null
    topic: string
    agreements: string | null
    notes: string | null
    attendance: number[]
    attendance_count: number
}

export interface ReferralArea {
    id: number
    college_id: number | null
    is_global: boolean
    name: string
    description: string | null
    handler_role_code: string | null
    is_active: boolean
    sort_order: number
}

export interface TutoringReferral {
    id: number
    student_id: number
    referral_area_id: number
    college_id: number
    reason: string
    status: 'open' | 'in_progress' | 'attended' | 'closed'
    response: string | null
    area_name: string
    num_control: string | null
    student_name: string
    referred_at?: string | null
    handled_at?: string | null
    closed_at?: string | null
}

export interface CedulaField {
    id?: number
    code: string
    label: string
    type: 'text' | 'textarea' | 'number' | 'select' | 'boolean'
    options: string[] | null
    is_required: boolean
    is_risk_flag: boolean
    sort_order?: number
}

export interface CedulaSetSummary {
    id: number
    college_id: number | null
    is_global: boolean
    name: string
    status: 'draft' | 'published' | 'archived'
    effective_from: string | null
    notes: string | null
    fields_count: number
}

export interface TuteeCedula {
    set_id: number | null
    fields: CedulaField[]
    answers: Record<string, unknown>
    risk_flags: Record<string, unknown>
    filled_at: string | null
}

export const REFERRAL_STATUS_LABELS: Record<string, string> = {
    open: 'Abierta',
    in_progress: 'En proceso',
    attended: 'Atendida',
    closed: 'Cerrada',
}
