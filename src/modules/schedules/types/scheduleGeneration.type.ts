export type RunStatus =
    | 'pending' | 'running' | 'ready' | 'infeasible'
    | 'timeout' | 'error' | 'discarded' | 'promoted'

export interface RunSolutionSummary {
    status?: string
    blocksCount?: number
    stats?: {
        durationMs?: number
        softScore?: number
        hardViolations?: number
        iterations?: number
        strategy?: string
    }
    diagnostics?: {
        reason?: string | null
        details?: Record<string, unknown> | null
        warnings?: string[]
    }
}

export interface RunListItem {
    id: number
    academicLoadConfigId: number
    collegeAcademicPeriodId: number
    scopeType: 'career' | 'semester' | 'group' | null
    scopeId: number | null
    status: RunStatus
    providerKind: string
    solutionSummary: RunSolutionSummary | null
    blocksCount: number
    parentRunId: number | null
    createdBy: number | null
    startedAt: string | null
    finishedAt: string | null
    createdAt: string | null
}

export interface RunDraftTeacher {
    id: number
    name: string
    role: 'main' | 'auxiliary' | 'support'
    isVacancy: boolean
}

export interface RunDraftBlock {
    id: number
    teacherAssignmentId: number
    placeId: number
    placeName: string
    placeShortName: string | null
    dayOfWeek: number | null
    date: string | null
    startTime: string
    endTime: string
    pinned: boolean
    subject: { name: string; shortName: string | null }
    group:   { name: string; shift: string | null }
    teachers: RunDraftTeacher[]
}

export interface RunDetail extends RunListItem {
    solverConfig: {
        weights?: Record<string, number> | null
        allowedPlaceIds?: number[] | null
        countDrafts?: number
        timeoutSeconds?: number
        seed?: number | null
        scopeType?: string
        scopeId?: number
    } | null
    drafts: RunDraftBlock[]
}

export interface GenerateRunRequest {
    academic_load_config_id: number
    career_id: number
    allowed_place_ids?: number[] | null
    weights?: Record<string, number> | null
    count_drafts?: number
    timeout_seconds?: number
    seed?: number | null
    /** F7.c — resuelve la carrera semestre a semestre (instancias más chicas) */
    decompose_by_semester?: boolean
}

export interface GenerateRunResponse {
    runs: Array<Omit<RunDetail, 'drafts'>>
}

export interface PromoteRunResponse {
    runId: number
    promoted: number
}

export interface PromoteConflictsError {
    message: string
    conflicts: Record<number, Record<string, string>>
}

export const WEIGHT_KEYS = [
    'preferShift',
    'minimizeTeacherGaps',
    'balanceTeacherDailyLoad',
    'samePlacePerSubject',
    'avoidLateForHighHP',
    'compactGroupSchedule',
] as const
export type WeightKey = typeof WEIGHT_KEYS[number]

export const WEIGHT_LABELS: Record<WeightKey, string> = {
    preferShift:              'Respetar turno del grupo',
    minimizeTeacherGaps:      'Evitar huecos del docente',
    balanceTeacherDailyLoad:  'Balancear carga diaria',
    samePlacePerSubject:      'Misma aula por materia',
    avoidLateForHighHP:       'Evitar materias con HP tarde',
    compactGroupSchedule:     'Compactar horario del grupo',
}

export const STATUS_LABELS: Record<RunStatus, string> = {
    pending:    'Pendiente',
    running:    'En proceso',
    ready:      'Listo',
    infeasible: 'Infactible',
    timeout:    'Timeout',
    error:      'Error',
    discarded:  'Descartado',
    promoted:   'Promovido',
}

export const STATUS_CLASSES: Record<RunStatus, string> = {
    pending:    'bg-slate-100 text-slate-600',
    running:    'bg-blue-100 text-blue-700',
    ready:      'bg-emerald-100 text-emerald-700',
    infeasible: 'bg-red-100 text-red-700',
    timeout:    'bg-amber-100 text-amber-700',
    error:      'bg-red-100 text-red-700',
    discarded:  'bg-slate-100 text-slate-500',
    promoted:   'bg-indigo-100 text-indigo-700',
}
