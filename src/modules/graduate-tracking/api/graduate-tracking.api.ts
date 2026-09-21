import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const graduateTrackingApi: ApiModule = {
    name: 'GRADUATE_TRACKING_API',
    api: {
        waves: {
            list:          apiUrl('/graduate-tracking/waves'),
            filterOptions: apiUrl('/graduate-tracking/waves/filter-options'),
            previewCohort: apiUrl('/graduate-tracking/waves/preview-cohort'),
            create:        apiUrl('/graduate-tracking/waves'),
            byId:   (id: string | number) => apiUrl(`/graduate-tracking/waves/${id}`),
            previewLink: (id: string | number) => apiUrl(`/graduate-tracking/waves/${id}/preview-link`),
            update: (id: string | number) => apiUrl(`/graduate-tracking/waves/${id}`),
            destroy:(id: string | number) => apiUrl(`/graduate-tracking/waves/${id}`),
            generate: (id: string | number) => apiUrl(`/graduate-tracking/waves/${id}/generate-invitations`),
            send:     (id: string | number) => apiUrl(`/graduate-tracking/waves/${id}/send-invitations`),
            open:     (id: string | number) => apiUrl(`/graduate-tracking/waves/${id}/open`),
            close:    (id: string | number) => apiUrl(`/graduate-tracking/waves/${id}/close`),
            invitations: (id: string | number) => apiUrl(`/graduate-tracking/waves/${id}/invitations`),
            statistics:  (id: string | number) => apiUrl(`/graduate-tracking/waves/${id}/statistics`),
        },
    },
}

export default graduateTrackingApi
