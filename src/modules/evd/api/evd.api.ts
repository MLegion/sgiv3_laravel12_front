import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const evdApi: ApiModule = {
    name: 'EVD_API',
    api: {
        myPending: apiUrl('/evd/my-pending'),
        myStatus:  apiUrl('/evd/my-status'),
        start:     (assignmentId: string | number) => apiUrl(`/evd/assignments/${assignmentId}/start`),

        admin: {
            // Resultados — el ámbito es el periodo SCA (CAP); se agregan a
            // través de todos sus TEPs y se segmentan por campus/modalidad/carrera.
            results:        (capId: string | number) => apiUrl(`/evd/admin/college-academic-periods/${capId}/results`),
            resultsFilters: (capId: string | number) => apiUrl(`/evd/admin/college-academic-periods/${capId}/results-filters`),
            teacherDetail:  (capId: string | number, teacherId: string | number) =>
                apiUrl(`/evd/admin/college-academic-periods/${capId}/teachers/${teacherId}/results`),

            // Gestión de periodos
            periodsOverview:   apiUrl('/evd/admin/periods-overview'),
            closePeriod:       (periodId: string | number) => apiUrl(`/evd/admin/periods/${periodId}/close`),
            openForModalities: (capId: string | number) => apiUrl(`/evd/admin/college-academic-periods/${capId}/open-for-modalities`),

            // Concentrados + toggle
            attendanceSummary: (capId: string | number) => apiUrl(`/evd/admin/college-academic-periods/${capId}/attendance-summary`),
            subjectsProgress:  (capId: string | number) => apiUrl(`/evd/admin/college-academic-periods/${capId}/subjects-progress`),
            toggleVisibility:  (taId: string | number)  => apiUrl(`/evd/admin/teacher-assignments/${taId}/evd-settings`),
        },
    },
}

export default evdApi
