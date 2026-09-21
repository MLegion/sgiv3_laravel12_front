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
    },
}

export default serviceDeskApi
