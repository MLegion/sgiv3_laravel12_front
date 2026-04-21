import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'COLLEGE_API',
    api: {
        users: {
            list:     apiUrl('/college/users'),
            byId:     (id: string | number) => apiUrl(`/college/users/${id}`),
            assign:   (id: string | number) => apiUrl(`/college/users/${id}/role-assignments`),
            revoke:   (id: string | number, assignmentId: string | number) => apiUrl(`/college/users/${id}/role-assignments/${assignmentId}`),
        },
        assignableRoles: apiUrl('/college/assignable-roles'),
        contextOptions:  (alias: string) => apiUrl(`/college/context-options/${alias}`),
        googleWorkspace: apiUrl('/college/google-workspace'),
    },
} satisfies ApiModule
