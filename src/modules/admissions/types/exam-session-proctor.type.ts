export type ProctorRole = 'TITULAR' | 'APOYO'

export interface ExamSessionProctor {
    id: number
    examSessionId: number
    userId: number
    role: ProctorRole
    isException: boolean
    exceptionReason: string | null
    createdAt: string | null
    updatedAt: string | null
    user: { id: number; name: string | null; email: string } | null
}

export interface ExamSessionProctorPayload {
    user_id: number
    role?: ProctorRole
    is_exception?: boolean
    exception_reason?: string | null
}
