import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'AUTH_API',
    api: {
        login: apiUrl('/auth/login'),
        superadminLogin: apiUrl('/auth/admin/login'),
        colleges: apiUrl('/colleges.json'),
        logout: apiUrl('/auth/logout'),
    },
} satisfies ApiModule
