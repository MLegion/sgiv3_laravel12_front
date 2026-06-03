import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const residenciesApi: ApiModule = {
    name: 'RESIDENCIES_API',
    api: {
        // ── Residencia (proceso) ──
        residency: {
            me:             apiUrl('/residencies/me'),
            myAdvisees:     apiUrl('/residencies/my-advisees'),
            list:           apiUrl('/residencies/residencies'),
            byId:           (id: string | number) => apiUrl(`/residencies/residencies/${id}`),
            approveProject: (id: string | number) => apiUrl(`/residencies/residencies/${id}/approve-project`),
            rejectProject:  (id: string | number) => apiUrl(`/residencies/residencies/${id}/reject-project`),
            assignAdvisor:  (id: string | number) => apiUrl(`/residencies/residencies/${id}/assign-advisor`),
            removeAdvisor:  (id: string | number, advisorId: string | number) => apiUrl(`/residencies/residencies/${id}/advisors/${advisorId}`),
        },

        // ── Documentos ──
        documents: {
            mine:            apiUrl('/residencies/me/documents'),
            uploadMine:      apiUrl('/residencies/me/documents'),
            downloadMine:    (id: string | number) => apiUrl(`/residencies/me/documents/${id}/download`),
            forResidency:    (id: string | number) => apiUrl(`/residencies/residencies/${id}/documents`),
            download:        (id: string | number) => apiUrl(`/residencies/documents/${id}/download`),
            approve:         (id: string | number) => apiUrl(`/residencies/documents/${id}/approve`),
            reject:          (id: string | number) => apiUrl(`/residencies/documents/${id}/reject`),
            autoAccept:      apiUrl('/residencies/documents/auto-accept'),
        },

        // ── Banco de proyectos ──
        projects: {
            available: apiUrl('/residencies/projects/available'),
            list:      apiUrl('/residencies/projects'),
            byId:      (id: string | number) => apiUrl(`/residencies/projects/${id}`),
            create:    apiUrl('/residencies/projects'),
            update:    (id: string | number) => apiUrl(`/residencies/projects/${id}`),
            publish:   (id: string | number) => apiUrl(`/residencies/projects/${id}/publish`),
            close:     (id: string | number) => apiUrl(`/residencies/projects/${id}/close`),
        },

        // ── Empresas y asesores externos ──
        companies: {
            options:        apiUrl('/residencies/companies/options'),
            list:           apiUrl('/residencies/companies'),
            byId:           (id: string | number) => apiUrl(`/residencies/companies/${id}`),
            create:         apiUrl('/residencies/companies'),
            approve:        (id: string | number) => apiUrl(`/residencies/companies/${id}/approve`),
            reject:         (id: string | number) => apiUrl(`/residencies/companies/${id}/reject`),
            advisors:       (companyId: string | number) => apiUrl(`/residencies/companies/${companyId}/advisors`),
            createAdvisor:  (companyId: string | number) => apiUrl(`/residencies/companies/${companyId}/advisors`),
            approveAdvisor: (companyId: string | number, id: string | number) => apiUrl(`/residencies/companies/${companyId}/advisors/${id}/approve`),
            rejectAdvisor:  (companyId: string | number, id: string | number) => apiUrl(`/residencies/companies/${companyId}/advisors/${id}/reject`),
        },
    },
}

export default residenciesApi
