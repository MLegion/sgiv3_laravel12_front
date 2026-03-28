import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'ADMISSIONS_API',
    api: {
        originSchools: {
            list:   apiUrl('/admissions/origin-schools'),
            byId:   (id: string | number) => apiUrl(`/admissions/origin-schools/${id}`),
            create: apiUrl('/admissions/origin-schools'),
            update: (id: string | number) => apiUrl(`/admissions/origin-schools/${id}`),
            delete: (id: string | number) => apiUrl(`/admissions/origin-schools/${id}`),
        },
    },
} satisfies ApiModule
