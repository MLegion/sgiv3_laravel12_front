import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'TEACHING_API',
    api: {
        teacherPortal: {
            myAssignments: apiUrl('/teaching/my-assignments'),
            roster:        apiUrl('/teaching/roster'),
        },
        instrumentations: {
            list:          apiUrl('/teaching/instrumentations'),
            seed:          (teacherAssignmentId: string | number) => apiUrl(`/teaching/instrumentations/seed?teacher_assignment_id=${teacherAssignmentId}`),
            calendar:      (teacherAssignmentId: string | number) => apiUrl(`/teaching/instrumentations/calendar?teacher_assignment_id=${teacherAssignmentId}`),
            pendingReview: apiUrl('/teaching/instrumentations/pending-review'),
            byId:          (id: string | number) => apiUrl(`/teaching/instrumentations/${id}`),
            create:        apiUrl('/teaching/instrumentations'),
            update:        (id: string | number) => apiUrl(`/teaching/instrumentations/${id}`),
            delete:        (id: string | number) => apiUrl(`/teaching/instrumentations/${id}`),
            submit:        (id: string | number) => apiUrl(`/teaching/instrumentations/${id}/submit`),
            review:        (id: string | number) => apiUrl(`/teaching/instrumentations/${id}/review`),
        },
        didacticSupports: {
            list:   (teacherAssignmentId: string | number) => apiUrl(`/teaching/didactic-supports?teacher_assignment_id=${teacherAssignmentId}`),
            create: apiUrl('/teaching/didactic-supports'),
        },
        evaluationProducts: {
            list:   apiUrl('/teaching/evaluation-products'),
            byId:   (id: string | number) => apiUrl(`/teaching/evaluation-products/${id}`),
            create: apiUrl('/teaching/evaluation-products'),
            update: (id: string | number) => apiUrl(`/teaching/evaluation-products/${id}`),
            delete: (id: string | number) => apiUrl(`/teaching/evaluation-products/${id}`),
        },
        evaluationCollections: {
            list:   apiUrl('/teaching/evaluation-collections'),
            byId:   (id: string | number) => apiUrl(`/teaching/evaluation-collections/${id}`),
            create: apiUrl('/teaching/evaluation-collections'),
            update: (id: string | number) => apiUrl(`/teaching/evaluation-collections/${id}`),
            delete: (id: string | number) => apiUrl(`/teaching/evaluation-collections/${id}`),
            attach: (id: string | number) => apiUrl(`/teaching/evaluation-collections/${id}/attach`),
            detach: (id: string | number, productId: string | number) => apiUrl(`/teaching/evaluation-collections/${id}/products/${productId}`),
        },
    },
} satisfies ApiModule
