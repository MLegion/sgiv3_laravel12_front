import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'APPCONFIG_API',
    api: {
        schemas: apiUrl('/appconfig/schemas'),
        college: {
            show:   (appId: string) => apiUrl(`/appconfig/college/${appId}`),
            update: (appId: string) => apiUrl(`/appconfig/college/${appId}`),
            forget: (appId: string, key: string) => apiUrl(`/appconfig/college/${appId}/${key}`),
        },
        global: {
            show:   (appId: string) => apiUrl(`/appconfig/global/${appId}`),
            update: (appId: string) => apiUrl(`/appconfig/global/${appId}`),
        },
    },
} as ApiModule
