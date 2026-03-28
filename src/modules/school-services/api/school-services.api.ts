import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'SCHOOL_SERVICES_API',
    api: {
        modalities: {
            list:   apiUrl('/school-services/modalities'),
            byId:   (id: string | number) => apiUrl(`/school-services/modalities/${id}`),
            create: apiUrl('/school-services/modalities'),
            update: (id: string | number) => apiUrl(`/school-services/modalities/${id}`),
            delete: (id: string | number) => apiUrl(`/school-services/modalities/${id}`),
        },
        campuses: {
            list:   apiUrl('/school-services/campuses'),
            byId:   (id: string | number) => apiUrl(`/school-services/campuses/${id}`),
            create: apiUrl('/school-services/campuses'),
            update: (id: string | number) => apiUrl(`/school-services/campuses/${id}`),
            delete: (id: string | number) => apiUrl(`/school-services/campuses/${id}`),
        },
        buildings: {
            list:   apiUrl('/school-services/buildings'),
            byId:   (id: string | number) => apiUrl(`/school-services/buildings/${id}`),
            create: apiUrl('/school-services/buildings'),
            update: (id: string | number) => apiUrl(`/school-services/buildings/${id}`),
            delete: (id: string | number) => apiUrl(`/school-services/buildings/${id}`),
        },
        places: {
            list:   apiUrl('/school-services/places'),
            byId:   (id: string | number) => apiUrl(`/school-services/places/${id}`),
            create: apiUrl('/school-services/places'),
            update: (id: string | number) => apiUrl(`/school-services/places/${id}`),
            delete: (id: string | number) => apiUrl(`/school-services/places/${id}`),
        },
        academicOffers: {
            list:   apiUrl('/school-services/academic-offers'),
            byId:   (id: string | number) => apiUrl(`/school-services/academic-offers/${id}`),
            create: apiUrl('/school-services/academic-offers'),
            update: (id: string | number) => apiUrl(`/school-services/academic-offers/${id}`),
            delete: (id: string | number) => apiUrl(`/school-services/academic-offers/${id}`),
            studyPlans:             (id: string | number) => apiUrl(`/school-services/academic-offers/${id}/study-plans`),
            linkStudyPlan:          (id: string | number) => apiUrl(`/school-services/academic-offers/${id}/study-plans`),
            unlinkStudyPlan:        (id: string | number, spId: string | number) => apiUrl(`/school-services/academic-offers/${id}/study-plans/${spId}`),
        },
        collegeAcademicPeriods: {
            list:   apiUrl('/school-services/college-academic-periods'),
            byId:   (id: string | number) => apiUrl(`/school-services/college-academic-periods/${id}`),
            create: apiUrl('/school-services/college-academic-periods'),
            update: (id: string | number) => apiUrl(`/school-services/college-academic-periods/${id}`),
            delete: (id: string | number) => apiUrl(`/school-services/college-academic-periods/${id}`),
        },
    },
} satisfies ApiModule
