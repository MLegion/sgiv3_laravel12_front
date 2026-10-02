import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'SHR_API',
    api: {
        employee: {
            list: apiUrl('/shr/employees'),
            byId: (id: string | number) => apiUrl(`/shr/employees/${id}`),
            create: apiUrl('/shr/employees'),
            update: (id: string | number) => apiUrl(`/shr/employees/${id}`),
            delete: (id: string | number) => apiUrl(`/shr/employees/${id}`),

            assingJob: (id: string | number) => apiUrl(`/shr/employees/${id}/assign-job`),
            history: (id: string | number) => apiUrl(`/shr/employees/${id}/jobs`),
            import: apiUrl('/shr/employees/import'),
        },
        jobPosition: {
            all: apiUrl('/shr/job-positions'),
            list: apiUrl('/shr/job-positions'),
            byId: (id: string | number) => apiUrl(`/shr/job-positions/${id}`),
            create: apiUrl('/shr/job-positions'),
            update: (id: string | number) => apiUrl(`/shr/job-positions/${id}`),
            delete: (id: string | number) => apiUrl(`/shr/job-positions/${id}`),
            import: apiUrl('/shr/job-positions/import'),
            assignableRoles: apiUrl('/shr/job-positions/assignable-roles'),
            contextOptions: (alias: string) => apiUrl(`/shr/job-positions/context-options/${alias}`),
            offerOptions: apiUrl('/shr/job-positions/offer-options'),
        },
        workArea: {
            all: apiUrl('/shr/work-areas'),
            list: apiUrl('/shr/work-areas'),
            byId: (id: string | number) => apiUrl(`/shr/work-areas/${id}`),
            create: apiUrl('/shr/work-areas'),
            update: (id: string | number) => apiUrl(`/shr/work-areas/${id}`),
            delete: (id: string | number) => apiUrl(`/shr/work-areas/${id}`),
            import: apiUrl('/shr/work-areas/import'),
        },
        organizationChart: {
            workAreas: apiUrl('/shr/organization-chart/work-areas'),
            import: apiUrl('/shr/organization-chart/import'),
        },
    },
} satisfies ApiModule
