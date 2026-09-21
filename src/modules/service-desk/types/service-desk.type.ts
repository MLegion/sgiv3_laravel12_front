export interface DeskDocument {
    id: number
    code: string
    name: string
    description: string | null
    requires_folio: boolean
    requires_signature: boolean
}

export interface StudentSummary {
    student_id: number
    num_control: string | null
    full_name: string
    curp: string | null
    career_name: string | null
    status_name: string | null
    semester: number | null
    period_name: string | null
    promedio: number | null
    creditos: number
}

export interface Emission {
    id: number
    document_code: string
    document_name: string
    folio: string | null
    status: 'issued' | 'delivered' | 'cancelled'
    issued_at: string | null
    delivered_at: string | null
    num_control?: string | null
    student_name?: string
    signed?: boolean | number
}
