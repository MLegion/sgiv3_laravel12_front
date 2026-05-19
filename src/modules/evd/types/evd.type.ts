export type EvdAssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'no_show'

export interface PendingEvaluation {
    assignment_id: number
    status: EvdAssignmentStatus
    started_at: string | null
    completed_at: string | null
    folio: string | null
    period: {
        id: number
        form_slug: string
        opens_at: string | null
        closes_at: string | null
    }
    subject: {
        id: number
        name: string
        official_code: string | null
    }
    group: {
        id: number
        name: string | null
    }
    teacher: {
        id: number
        name: string
    } | null
}

/* ── Estado del alumno (/evd/my-status) ────────────────────────────── */

export interface MyEvdAssignment {
    assignment_id: number
    status: EvdAssignmentStatus
    started_at: string | null
    completed_at: string | null
    period: {
        id: number
        form_slug: string
        status: 'draft' | 'open' | 'closed'
    }
    subject: { id: number; name: string; official_code: string | null }
    group:   { id: number; name: string | null }
    teacher: { id: number; name: string } | null
}

export interface MyEvdAcuse {
    folio: string
    issued_at: string | null
    total_completed: number
}

export interface MyEvdStatus {
    period_has_any_tep: boolean
    modality_tep_open:  boolean
    total: number
    completed: number
    progress_pct: number
    acuse: MyEvdAcuse | null
    assignments: MyEvdAssignment[]
}

/* ── Admin: concentrado de alumnos (folios + presentación) ───────── */

export interface EvdAttendanceRow {
    student: { id: number; num_control: string | null; full_name: string }
    career:  { id: number; short_name: string | null } | null
    total_assignments: number
    completed_assignments: number
    progress_pct: number
    acuse: { folio: string; issued_at: string | null } | null
}

/* ── Admin: avance por materia (con toggles visibilidad) ─────────── */

export interface EvdSubjectProgressRow {
    teacher_assignment_id: number
    subject:  { id: number; name: string; official_code: string | null }
    group:    { id: number; name: string | null; shift: string | null }
    teacher:  { id: number; name: string } | null
    modality: { id: number; name: string | null } | null
    total_assignments: number
    completed_assignments: number
    progress_pct: number
    visible_for_students: boolean
    visible_in_consolidated_report: boolean
}

/* ── Admin: modalidades disponibles para apertura masiva ─────────── */

export interface EvdAvailableModality {
    id: number
    name: string
    modality_type_name: string | null
    campus_name: string | null
    is_open: boolean
}

/* ── Admin ─────────────────────────────────────────────────────────── */

export interface EvdAdminPeriodRow {
    id: number
    form_slug: string
    status: 'draft' | 'open' | 'closed'
    opens_at: string | null
    closes_at: string | null
    modality: { id: number; name: string | null } | null
    college_academic_period: {
        id: number
        name: string
        short_name: string | null
    }
    total_assignments: number
    completed_assignments: number
    progress_pct: number
}

export type EvdLevel = 'EXCELENTE' | 'NOTABLE' | 'BUENO' | 'SUFICIENTE' | 'INSUFICIENTE' | null

export interface EvdTeacherResultRow {
    teacher: { id: number; name: string; custom_id: string | null }
    areas_count: number
    total_responses: number
    overall_avg: number | null
    min_area_avg: number | null
    max_area_avg: number | null
}

export interface EvdAreaResult {
    area_code: string
    area_title: string
    respondents_count: number
    sum_score: number
    avg_score: number
    level: EvdLevel
}

export interface EvdTeacherAssignmentRow {
    id: number
    status: 'pending' | 'in_progress' | 'completed' | 'no_show'
    completed_at: string | null
    folio: string | null
    subject: { id: number; name: string; official_code: string | null } | null
    group:   { id: number; name: string | null } | null
}

export interface EvdTeacherDetail {
    teacher: { id: number; name: string; custom_id: string | null } | null
    period: {
        id: number
        form_slug: string
        status: string
        period_name: string
        period_short_name: string | null
    } | null
    overall: { avg: number | null; level: EvdLevel } | null
    areas: EvdAreaResult[]
    assignments: EvdTeacherAssignmentRow[]
}

export interface EvaluationStartResponse {
    assignment_id: number
    form_slug: string
    status: EvdAssignmentStatus
    sgi_forms_url: string | null
    sso_token: string | null
    context: Record<string, unknown>
}
