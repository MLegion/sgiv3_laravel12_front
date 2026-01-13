import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'USER_API',
    api: {
        menus: apiUrl('/user/menus.json'),
        profile: apiUrl('/user/profile'),
        avatar: apiUrl('/user/avatar'),
        updateProfile: apiUrl('/user/profile/update'),
    },
} satisfies ApiModule
