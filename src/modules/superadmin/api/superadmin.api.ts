import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'SUPERADMIN_API',
    api: {
        colleges: apiUrl('/superadmin/colleges'),
    },
} satisfies ApiModule
