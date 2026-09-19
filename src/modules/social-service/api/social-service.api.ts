import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const socialServiceApi: ApiModule = {
    name: 'SOCIAL_SERVICE_API',
    api: {
        // ── Portal del prestador ──
        me: {
            get:          apiUrl('/social-service/me'),
            update:       apiUrl('/social-service/me'),
            reports:      apiUrl('/social-service/me/reports'),
            submitReport: apiUrl('/social-service/me/reports'),
        },

        // ── Catálogos para el prestador ──
        dependencies:       apiUrl('/social-service/dependencies'),
        availablePrograms:  apiUrl('/social-service/programs/available'),

        // ── Gestión (coordinador / jefe / asesor) ──
        records: {
            list:          apiUrl('/social-service/records'),
            filterOptions: apiUrl('/social-service/records/filter-options'),
            create:        apiUrl('/social-service/records'),
            byId:          (id: string | number) => apiUrl(`/social-service/records/${id}`),
            process:       (id: string | number) => apiUrl(`/social-service/records/${id}/process`),
            activate:      (id: string | number) => apiUrl(`/social-service/records/${id}/activate`),
            release:       (id: string | number) => apiUrl(`/social-service/records/${id}/release`),
            drop:          (id: string | number) => apiUrl(`/social-service/records/${id}`),
            grantException:  (id: string | number) => apiUrl(`/social-service/records/${id}/process-exception`),
            revokeException: (id: string | number) => apiUrl(`/social-service/records/${id}/process-exception`),
            reports:       (id: string | number) => apiUrl(`/social-service/records/${id}/reports`),
        },

        // ── Reportes de avance (revisión) ──
        reports: {
            review: (id: string | number) => apiUrl(`/social-service/reports/${id}/review`),
        },

        // ── Banco de programas ──
        programs: {
            list:    apiUrl('/social-service/programs'),
            create:  apiUrl('/social-service/programs'),
            update:  (id: string | number) => apiUrl(`/social-service/programs/${id}`),
            publish: (id: string | number) => apiUrl(`/social-service/programs/${id}/publish`),
            close:   (id: string | number) => apiUrl(`/social-service/programs/${id}/close`),
        },
    },
}

export default socialServiceApi
