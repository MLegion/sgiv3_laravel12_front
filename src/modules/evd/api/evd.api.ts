import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const evdApi: ApiModule = {
    name: 'EVD_API',
    api: {
        myPending: apiUrl('/evd/my-pending'),
        myStatus:  apiUrl('/evd/my-status'),
        start:     (assignmentId: string | number) => apiUrl(`/evd/assignments/${assignmentId}/start`),

        admin: {
            periods:       apiUrl('/evd/admin/periods'),
            results:       (periodId: string | number) => apiUrl(`/evd/admin/periods/${periodId}/results`),
            teacherDetail: (periodId: string | number, teacherId: string | number) =>
                apiUrl(`/evd/admin/periods/${periodId}/teachers/${teacherId}`),
            // Gestión
            openPeriod:        apiUrl('/evd/admin/periods'),
            closePeriod:       (periodId: string | number) => apiUrl(`/evd/admin/periods/${periodId}/close`),
            openForModalities: (capId: string | number) => apiUrl(`/evd/admin/college-academic-periods/${capId}/open-for-modalities`),

            // Concentrados + toggle
            attendanceSummary:   (capId: string | number) => apiUrl(`/evd/admin/college-academic-periods/${capId}/attendance-summary`),
            subjectsProgress:    (capId: string | number) => apiUrl(`/evd/admin/college-academic-periods/${capId}/subjects-progress`),
            toggleVisibility:    (taId: string | number)  => apiUrl(`/evd/admin/teacher-assignments/${taId}/evd-settings`),
            availableModalities: (capId: string | number) => apiUrl(`/evd/admin/college-academic-periods/${capId}/available-modalities`),
        },
    },
}

export default evdApi
