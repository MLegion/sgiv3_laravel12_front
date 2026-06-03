import type { AuthUser } from '@/shared/types/user'
import type { College } from '@/shared/types/college'
import type { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum'

export interface SubjectType {
    id: number

    name: string
    shortName: string | null
    officialCode: string

    /** Enlace externo al programa (o fallback si hay copia local). */
    programUrl?: string | null
    /** true = el programa está respaldado localmente y lo sirve la app. */
    programIsLocal?: boolean
    /** Origen externo del que se descargó la copia local. */
    programSourceUrl?: string | null

    ht: number
    hp: number
    credits: number

    specialtyId: number | null
    optionalGroupId: number | null

    /** Tipo especial (servicio social / actividades complementarias / residencia). null = normal. */
    specialType: 'social_service' | 'complementary_activities' | 'professional_residency' | null

    collegeId: number | null
    college?: College | null

    createdBy: number
    creator?: AuthUser | null

    approvedBy: number | null
    approver?: AuthUser | null

    approvedAt: string | null
    approvalStatus: ApprovalStatusEnum

    isActive: boolean

    createdAt: string
    updatedAt: string
}
