export interface ApplicantDocument {
    id: number
    applicantId: number
    documentTypeId: number
    documentType: { id: number; name: string; shortName: string } | null
    disk: string
    path: string
    originalName: string
    mimeType: string | null
    sizeKb: number | null
    status: 'pending' | 'reviewing' | 'approved' | 'rejected'
    rejectionReason: string | null
    reviewedBy: number | null
    reviewedAt: string | null
    createdAt: string
    updatedAt: string
}

export const DOC_STATUS_OPTIONS = [
    { value: 'pending',   label: 'PENDIENTE' },
    { value: 'reviewing', label: 'EN REVISIÓN' },
    { value: 'approved',  label: 'APROBADO' },
    { value: 'rejected',  label: 'RECHAZADO' },
]

export const DOC_STATUS_CLASSES: Record<string, string> = {
    pending:   'bg-slate-100 text-slate-600',
    reviewing: 'bg-yellow-100 text-yellow-700',
    approved:  'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-700',
}
