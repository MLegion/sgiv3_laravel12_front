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
        sign:    apiUrl('/signatures/sign'),
        for:     apiUrl('/signatures/for'),
        pending: apiUrl('/signatures/pending'),
        verify: (folio: string, token?: string) => apiUrl(`/signatures/verify/${folio}${token ? `?t=${encodeURIComponent(token)}` : ''}`),
        // Capa B: archivar el PDF emitido como evidencia (auto-subida tras firmar).
        archiveDocument: (folio: string) => apiUrl(`/signatures/${folio}/document`),
        // Presentación pública del documento archivado (token-gated por el QR).
        documentUrl: (folio: string, token: string) => apiUrl(`/signatures/verify/${folio}/document?t=${encodeURIComponent(token)}`),
    },
} satisfies ApiModule
