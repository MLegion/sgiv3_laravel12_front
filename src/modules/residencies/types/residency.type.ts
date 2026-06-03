export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ResidencyStatus = 'registered' | 'in_progress' | 'concluded' | 'dropped'
export type ProjectOption = 'worker' | 'own' | 'bank'
export type ProjectBankStatus = 'draft' | 'published' | 'closed'

/** Residencia presentada (camelCase desde EloquentResidencyRepository). */
export interface Residency {
    id: number
    status: ResidencyStatus
    collegeAcademicPeriodId: number | null
    numControl: string | null
    studentName: string | null
    career: string | null
    careerId: number | null
    companyId: number | null
    company: string | null
    companyAdvisorId: number | null
    companyAdvisor: string | null
    internalAdvisorId: number | null
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
    typeId: number
    originalName: string | null
    mimeType: string | null
    sizeKb: number | null
    status: ApprovalStatus
    rejectionReason: string | null
    reviewedBy: string | null
    reviewedAt: string | null
    uploadedAt: string | null
}

/** Renglón del checklist de documentos: tipo + documento subido (o null). */
export interface ResidencyDocumentChecklistItem {
    typeId: number
    code: string
    name: string
    shortName: string | null
    description: string | null
    acceptsFormats: string[] | null
    maxSizeKb: number | null
    sortOrder: number
    document: ResidencyDocument | null
}

/** Empresa (snake_case crudo desde toArray()). */
export interface Company {
    id: number
    college_id: number
    name: string
    rfc: string | null
    sector: string | null
    address: string | null
    phone: string | null
    email: string | null
    titular_name: string | null
    titular_position: string | null
    approval_status: ApprovalStatus
    approval_notes: string | null
}

export interface CompanyAdvisor {
    id: number
    company_id: number
    name: string
    position: string | null
    email: string | null
    phone: string | null
    approval_status: ApprovalStatus
    approval_notes: string | null
}

export interface ProjectCareerRef {
    id: number
    name: string
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
