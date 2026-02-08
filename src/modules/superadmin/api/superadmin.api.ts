import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'SUPERADMIN_API',
    api: {
        colleges: {
            list:apiUrl('/superadmin/colleges'),
            byId: (id: string | number) => apiUrl(`/superadmin/colleges/${id}`),
            createWithAdmin: apiUrl('/superadmin/colleges/create.with.admin'),
            update: (id: string | number) => apiUrl(`/superadmin/colleges/${id}`),
            delete: (id: string | number) => apiUrl(`/superadmin/colleges/${id}`),
        },
        modalityTypes: {
            list: apiUrl('/superadmin/modality-types'),
            byId: (id: string | number) => apiUrl(`/superadmin/modality-types/${id}`),
            create: apiUrl('/superadmin/modality-types'),
            defaultConfig: apiUrl('/superadmin/modality-types/config/default'),
            update: (id: string | number) => apiUrl(`/superadmin/modality-types/${id}`),
            delete: (id: string | number) => apiUrl(`/superadmin/modality-types/${id}`),
        },
        careers: {
            list: apiUrl('/superadmin/careers'),
            byId: (id: string | number) => apiUrl(`/superadmin/careers/${id}`),
            create: apiUrl('/superadmin/careers'),
            update: (id: string | number) => apiUrl(`/superadmin/careers/${id}`),
            delete: (id: string | number) => apiUrl(`/superadmin/careers/${id}`),
            approve: (id: string | number) => apiUrl(`/superadmin/careers/${id}/approve`),
            rejecte: (id: string | number) => apiUrl(`/superadmin/careers/${id}/rejecte`),
        },
        subjects: {
            list: apiUrl('/superadmin/subjects'),
            byId: (id: string | number) => apiUrl(`/superadmin/subjects/${id}`),
            create: apiUrl('/superadmin/subjects'),
            update: (id: string | number) => apiUrl(`/superadmin/subjects/${id}`),
            delete: (id: string | number) => apiUrl(`/superadmin/subjects/${id}`),
            approve: (id: string | number) => apiUrl(`/superadmin/subjects/${id}/approve`),
            rejecte: (id: string | number) => apiUrl(`/superadmin/subjects/${id}/rejecte`),
        },
        studyPlans: {
            list: apiUrl('/superadmin/study-plans'),
            byId: (id: string | number) => apiUrl(`/superadmin/study-plans/${id}`),
            create: apiUrl('/superadmin/study-plans'),
            update: (id: string | number) => apiUrl(`/superadmin/study-plans/${id}`),
            delete: (id: string | number) => apiUrl(`/superadmin/study-plans/${id}`),
        },
        curruculum: {
            list: (id: string | number) => apiUrl(`/superadmin/study-plans/${id}/curriculum`),
            byId: (studyPlanId: string | number, curriculumId: string | number) => apiUrl(`/superadmin/study-plans/${studyPlanId}/curriculum/${curriculumId}`),
            create: (id: string | number) => apiUrl(`/superadmin/study-plans/${id}/curriculum`),
            update: (studyPlanId: string | number, curriculumId: string | number) => apiUrl(`/superadmin/study-plans/${studyPlanId}/curriculum/${curriculumId}`),
            delete: (studyPlanId: string | number, curriculumId: string | number) => apiUrl(`/superadmin/study-plans/${studyPlanId}/curriculum/${curriculumId}`),
        },
        specialties: {
            list: apiUrl('/superadmin/specialties'),
            byId: (id: string | number) => apiUrl(`/superadmin/specialties/${id}`),
            create: apiUrl('/superadmin/specialties'),
            update: (id: string | number) => apiUrl(`/superadmin/specialties/${id}`),
            delete: (id: string | number) => apiUrl(`/superadmin/specialties/${id}`),
        },
    },
} satisfies ApiModule
