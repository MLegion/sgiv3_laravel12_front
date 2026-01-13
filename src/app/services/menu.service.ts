import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { MenuItem } from '@/shared/types/menu'

export async function fetchMenus(): Promise<any> {
    return api.get(API.USER_API.menus)
}
