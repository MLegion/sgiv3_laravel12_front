import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'MODULES_API',
    api: {
        list:   apiUrl('/modules'),
        toggle: apiUrl('/modules/toggle'),
    },
} satisfies ApiModule
