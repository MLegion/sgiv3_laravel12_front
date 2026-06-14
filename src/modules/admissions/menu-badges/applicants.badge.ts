import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { MenuBadgeSource } from '@/app/services/menu-badges'

/**
 * Badge "Documentos por revisar" sobre el item de menú de Aspirantes:
 * conteo de aspirantes con documentos pending/rejected en el college.
 */
const source: MenuBadgeSource = {
    codes: ['adm.admissions.applicants'],
    async resolve() {
        try {
            const res = await api.get(API.ADMISSIONS_API.applicants.docsToReviewCount)
            const count = res.data?.count ?? 0
            return count > 0 ? { 'adm.admissions.applicants': count } : {}
        } catch {
            return {}
        }
    },
}

export default source
