export interface EmployeeShowType {
    id: number
    names: string
    firstSurname: string
    secondSurname?: string | null
    collegeId: number
    curp?: string | null
    rfc?: string | null
    phone?: string | null
    email: string
    userId: number
    user: {
        id: number
        name: string
        email: string
        must_change_password: boolean
        email_verified_at?: string | null
        created_at: string
        updated_at: string
    }
    currentJobPosition?: {
        id: number
        name: string
        description?: string
        status: number
    }
    hireDate: string
    fireDate?: string | null
    status: boolean
    createdAt: string
    updatedAt: string
}
