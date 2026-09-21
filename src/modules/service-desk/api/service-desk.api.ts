import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const serviceDeskApi: ApiModule = {
    name: 'SERVICE_DESK_API',
    api: {
        documents:      apiUrl('/service-desk/documents'),
        studentSummary: (id: string | number) => apiUrl(`/service-desk/students/${id}/summary`),
        emit:           apiUrl('/service-desk/emissions'),
        emissions:      apiUrl('/service-desk/emissions'),
        emission:  (id: string | number) => apiUrl(`/service-desk/emissions/${id}`),
        document:  (id: string | number) => apiUrl(`/service-desk/emissions/${id}/document`),
        sign:      (id: string | number) => apiUrl(`/service-desk/emissions/${id}/sign`),
        deliver:   (id: string | number) => apiUrl(`/service-desk/emissions/${id}/deliver`),
        cancel:    (id: string | number) => apiUrl(`/service-desk/emissions/${id}/cancel`),

        // Portal del estudiante
        myRequestableDocuments: apiUrl('/service-desk/me/requestable-documents'),
        myRequests:             apiUrl('/service-desk/me/requests'),
        createRequest:          apiUrl('/service-desk/me/requests'),
        myRequestDocument: (id: string | number) => apiUrl(`/service-desk/me/requests/${id}/document`),

        // Bandeja (ventanilla)
        config:        apiUrl('/service-desk/config'),
        requests:      apiUrl('/service-desk/requests'),
        issueRequest:  (id: string | number) => apiUrl(`/service-desk/requests/${id}/issue`),
        rejectRequest: (id: string | number) => apiUrl(`/service-desk/requests/${id}/reject`),
    },
}

export default serviceDeskApi
