import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'REPORTS_API',
    api: {
        reports: {
            list:   apiUrl('/reports/reports'),
            byId:   (id: string | number) => apiUrl(`/reports/reports/${id}`),
            create: apiUrl('/reports/reports'),
            update: (id: string | number) => apiUrl(`/reports/reports/${id}`),
            delete: (id: string | number) => apiUrl(`/reports/reports/${id}`),
        },
        daos: {
            list:    apiUrl('/reports/daos'),
            byId:    (id: string | number) => apiUrl(`/reports/daos/${id}`),
            create:  apiUrl('/reports/daos'),
            update:  (id: string | number) => apiUrl(`/reports/daos/${id}`),
            delete:  (id: string | number) => apiUrl(`/reports/daos/${id}`),
            execute: (id: string | number) => apiUrl(`/reports/daos/${id}/execute`),
            dryRun:  apiUrl('/reports/daos/dry-run'),
        },
        schema: {
            get: apiUrl('/reports/schema'),
        },
    },
} satisfies ApiModule
