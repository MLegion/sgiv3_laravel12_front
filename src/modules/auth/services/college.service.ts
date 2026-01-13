import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { College } from '@/shared/types/college'
import type { CollegeListResponse } from '@/shared/types/college-response'

export async function fetchColleges() {
    const { data } = await api.get<CollegeListResponse>(
        API.AUTH_API.colleges
    )

    // 🔒 Mapeo seguro (solo lo que la UI necesita)
    const colleges: College[] = data.items.map(item => ({
        id: item.id,
        name: item.name,
        short_name: item.short_name,
    }))

    return colleges
}
