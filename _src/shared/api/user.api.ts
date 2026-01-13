import { apiUrl } from './config'

export const USER_API = {
    menus: apiUrl('/user/menus.json'),
    profile: apiUrl('/user/profile'),
    avatar: apiUrl('/user/avatar'),
    updateProfile: apiUrl('/user/profile/update'),
}
