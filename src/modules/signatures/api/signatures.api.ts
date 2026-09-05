import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'SIGNATURES_API',
    api: {
        profile: {
            show:         apiUrl('/signatures/profile'),
            update:       apiUrl('/signatures/profile'),
            rubric:       apiUrl('/signatures/profile/rubric'),
            deleteRubric: apiUrl('/signatures/profile/rubric'),
        },
        sign:   apiUrl('/signatures/sign'),
        for:    apiUrl('/signatures/for'),
        verify: (folio: string) => apiUrl(`/signatures/verify/${folio}`),
    },
} satisfies ApiModule
