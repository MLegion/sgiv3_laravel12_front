import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'COLLEGE_API',
    api: {
        list: apiUrl('/colleges'),
        byId: (id: string | number) => apiUrl(`/colleges/${id}`),
    },
} satisfies ApiModule
