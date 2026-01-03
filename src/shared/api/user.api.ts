import { apiUrl } from './config'

export const USER_API = {
    profile: apiUrl('/user/profile'),
    avatar: apiUrl('/user/avatar'),
    updateProfile: apiUrl('/user/profile/update'),
}
