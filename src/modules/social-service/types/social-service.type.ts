export type SocialServiceStatus =
    | 'pending_activation'
    | 'registered'
    | 'in_progress'
    | 'concluded'
    | 'dropped'

export interface SocialServiceNormativaRef {
    id: number
    name: string
    required_hours: number
    report_count: number
}

export interface SocialServiceRecord {
    id: number
    status: SocialServiceStatus
    college_id: number
    career_id: number | null
    subject_id: number | null
    required_hours: number
    accumulated_hours: number
    progress_percent: number
    company_id: number | null
    company_name: string | null
    company_responsible_id: number | null
    responsible_name: string | null
    internal_advisor_id: number | null
    program_id: number | null
    program_title: string | null
    program_approval_status: string | null
    started_at: string | null
    expected_end_at: string | null
    released_at: string | null
    kardex_synced_at: string | null
    process_exception_until: string | null
    grade_exception_until: string | null
    processOpen: boolean
    normativa: SocialServiceNormativaRef | null
    period: { id: number; name: string | null } | null
    student: { id: number; user_id: number | null; name: string; num_control: string | null } | null
}

export interface SocialServiceListRow {
    id: number
    status: SocialServiceStatus
    required_hours: number
    accumulated_hours: number
    program_title: string | null
    program_approval_status: string | null
    student_name: string | null
    num_control: string | null
    career_name: string | null
    company_name: string | null
    period_name: string | null
}

export interface SocialServiceReport {
    id: number
    record_id: number
    report_number: number
    period_start: string | null
    period_end: string | null
    hours: number
    activities: string | null
    has_file: boolean
    original_name: string | null
    status: 'pending' | 'approved' | 'rejected'
    rejection_reason: string | null
    submitted_at: string | null
    reviewed_at: string | null
}

export interface SocialServiceProgram {
    id: number
    college_id: number
    title: string
    description: string | null
    required_profile: string | null
    company_id: number | null
    company_name: string | null
    is_internal: boolean
    slots: number | null
    status: 'draft' | 'published' | 'closed'
    careers: { id: number; name: string }[]
}

export interface DependencyOption {
    id: number
    name: string
    rfc: string | null
    sector_id: number | null
}

export const STATUS_LABELS: Record<SocialServiceStatus, string> = {
    pending_activation: 'Por activar',
    registered: 'Registrado',
    in_progress: 'En proceso',
    concluded: 'Liberado',
    dropped: 'Baja',
}
