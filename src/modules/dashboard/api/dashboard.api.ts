import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'DASHBOARD_API',
    api: {
        widgets: {
            list:    apiUrl('/dashboard/widgets'),
            catalog: apiUrl('/dashboard/widgets/catalog'),
            data:    (id: string) => apiUrl(`/dashboard/widgets/${id}/data`),
            add:     (id: string) => apiUrl(`/dashboard/widgets/mine/${id}`),
            remove:  (id: string) => apiUrl(`/dashboard/widgets/mine/${id}`),
        },
    },
} satisfies ApiModule
