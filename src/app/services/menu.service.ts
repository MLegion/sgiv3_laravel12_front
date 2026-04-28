import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

export async function fetchMenus(): Promise<any> {
    return api.get(API.USER_API.menus)
}
