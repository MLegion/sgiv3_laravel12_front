export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ResidencyStatus = 'pending_activation' | 'registered' | 'in_progress' | 'concluded' | 'dropped'
export type ProjectOption = 'worker' | 'own' | 'bank'
export type ProjectBankStatus = 'draft' | 'published' | 'closed'
export type ResidencyAdvisorType = 'principal' | 'vocal_1' | 'vocal_2' | 'vocal_suplente'

/** Catálogo de tipos de asesor interno (comisión revisora). */
export const ADVISOR_TYPE_OPTIONS: { value: ResidencyAdvisorType; label: string }[] = [
    { value: 'principal',      label: 'PRINCIPAL' },
    { value: 'vocal_1',        label: 'VOCAL 1' },
    { value: 'vocal_2',        label: 'VOCAL 2' },
    { value: 'vocal_suplente', label: 'VOCAL SUPLENTE' },
]

export interface ResidencyAdvisorRef {
    id: number
    advisorUserId: number
    advisorName: string | null
    advisorType: ResidencyAdvisorType
    advisorTypeLabel: string | null
}

/** Residencia presentada (camelCase desde EloquentResidencyRepository). */
export interface Residency {
    id: number
    status: ResidencyStatus
    collegeAcademicPeriodId: number | null
    periodActive: boolean
    processOpen: boolean
    gradeOpen: boolean
    exceptionInfoUntil: string | null
    exceptionGradeUntil: string | null
    exceptionReason: string | null
    numControl: string | null
    studentName: string | null
    career: string | null
    careerId: number | null
    companyId: number | null
    company: string | null
    companyAdvisorId: number | null
    companyAdvisor: string | null
    advisors: ResidencyAdvisorRef[]
    projectOption: ProjectOption | null
    projectId: number | null
    project: string | null
    projectTitle: string | null
    projectApprovalStatus: ApprovalStatus | null
    nss: string | null
    registeredAt: string | null
}

export interface ResidencyDocument {
    id: number
    residencyId: number
    code: string
    originalName: string | null
    mimeType: string | null
    sizeKb: number | null
    status: ApprovalStatus
    rejectionReason: string | null
    reviewedBy: string | null
    reviewedAt: string | null
    uploadedAt: string | null
}

/** Renglón del checklist de documentos: requisito (del set anclado) + subido (o null). */
export interface ResidencyDocumentChecklistItem {
    code: string
    name: string
    shortName: string | null
    description: string | null
    kind: 'upload' | 'generated'
    generatedReportCode: string | null
    acceptsFormats: string[] | null
    maxSizeKb: number | null
    isRequired: boolean
    sortOrder: number
    document: ResidencyDocument | null
}

/** Empresa (snake_case crudo desde toArray()). */
export interface Company {
    id: number
    college_id: number
    name: string
    rfc: string | null
    sector_id: number | null
    sector: { id: number; name: string } | null
    address: string | null
    phone: string | null
    email: string | null
    approval_status: ApprovalStatus
    approval_notes: string | null
}

/** Puesto vigente del personal externo (persona-en-puesto). */
export interface CompanyEmployeePosition {
    assignment_id: number
    position_id: number
    name: string
    start_date: string | null
}

/**
 * Personal externo de una empresa (unifica al antiguo asesor externo). Shape
 * aplanado por presentEmployee() en el backend.
 */
export interface CompanyEmployee {
    id: number
    company_id: number
    names: string
    first_surname: string | null
    second_surname: string | null
    full_name: string
    email: string | null
    phone: string | null
    approval_status: ApprovalStatus
    approval_notes: string | null
    current_position: CompanyEmployeePosition | null
}

/** Puesto del catálogo global del personal externo. */
export interface ExternalJobPosition {
    id: number
    name: string
    is_active: boolean
}

/** Persona del personal externo pendiente de validar (cola del coordinador/jefe). */
export interface PendingPersonnel {
    id: number
    companyId: number
    fullName: string
    email: string | null
    phone: string | null
    companyName: string | null
}

/** Ajustes del personal externo por college (delegación + umbrales de purga). */
export interface PersonnelSettings {
    delegateReview: boolean
    rejectedPurgeDays: number | null
    pendingPurgeDays: number | null
}

/** Documento dentro de una versión de requisitos (editor). */
export interface RequirementSetItem {
    code: string
    name: string
    shortName: string | null
    description: string | null
    kind: 'upload' | 'generated'
    generatedReportCode: string | null
    acceptsFormats: string[] | null
    maxSizeKb: number | null
    isRequired: boolean
    sortOrder: number
}

/** Versión/generación de requisitos documentales (renglón de lista). */
export interface RequirementSetRow {
    id: number
    name: string
    isGlobal: boolean
    effectiveFrom: string | null
    status: 'draft' | 'published' | 'archived'
    notes: string | null
    itemsCount: number
    editable: boolean
}

export interface RequirementSetDetail extends Omit<RequirementSetRow, 'itemsCount'> {
    items: RequirementSetItem[]
}

export interface ProjectCareerRef {
    id: number
    name: string
}

/** Renglón del archivo histórico de residencias (migrado de SGIv2). */
export interface LegacyResidencyRow {
    id: number
    externalId: number
    source: string
    numControl: string | null
    studentName: string | null
    studentId: number | null
    companyName: string | null
    career: string | null
    careerId: number | null
    internalAdvisorName: string | null
    internalAdvisorId: number | null
    status: string | null
    projectOption: string | null
    projectTitle: string | null
    periodLabel: string | null
    documentsCount: number
}

export interface LegacyFilterOption {
    id: number
    name: string
}
export interface LegacyFilterOptions {
    careers: LegacyFilterOption[]
    advisors: LegacyFilterOption[]
}

export interface LegacyResidencyDocument {
    id: number
    code: string
    originalName: string | null
    sizeKb: number | null
}

export interface LegacyResidencyDetail extends LegacyResidencyRow {
    companyRfc: string | null
    place: string | null
    projectTitle: string | null
    externalAdvisorName: string | null
    internalAdvisorName: string | null
    documents: LegacyResidencyDocument[]
}

export interface ResidencyEvaluationComponent {
    key: string
    label: string
    weight: number
    score: number | null
    capturedBy: string | null
    capturedAt: string | null
}

export interface ResidencyEvaluation {
    residencyId: number
    status: ResidencyStatus
    components: ResidencyEvaluationComponent[]
    final: number
    passed: boolean
    complete: boolean
    finalGrade: number | null
    kardexSyncedAt: string | null
    concludedAt: string | null
}

export interface ResidencyStatLabelCount { label: string; count: number }

export interface ResidencyStatistics {
    total: number
    byStatus: Record<string, number>
    byCareer: ResidencyStatLabelCount[]
    byModality: Record<string, number>
    byCompany: ResidencyStatLabelCount[]
    approval: { passed: number; failed: number }
    gradeBins: number[]
}

export interface ResidencyProject {
    id: number
    title: string
    description: string | null
    requiredProfile: string | null
    isInternal: boolean
    company: string | null
    companyId: number | null
    slots: number
    occupied: number
    available: number
    status: ProjectBankStatus
    careers: ProjectCareerRef[]
}
