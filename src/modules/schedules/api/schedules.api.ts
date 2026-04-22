import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'SCHEDULES_API',
    api: {
        academic: {
            byConfig:        (configId: string | number) => apiUrl(`/schedules/academic/${configId}`),
            assignable:      (configId: string | number) => apiUrl(`/schedules/academic/${configId}/assignable`),
            create:          apiUrl('/schedules/academic'),
            update:          (id: string | number) => apiUrl(`/schedules/academic/${id}`),
            delete:          (id: string | number) => apiUrl(`/schedules/academic/${id}`),
            removeSlots:     (id: string | number) => apiUrl(`/schedules/academic/${id}/remove-slots`),
            checkConflicts:  apiUrl('/schedules/academic/check-conflicts'),
            availablePlaces: apiUrl('/schedules/academic/available-places'),
        },
        complementary: {
            list:   apiUrl('/schedules/complementary'),
            create: apiUrl('/schedules/complementary'),
            update: (id: string | number) => apiUrl(`/schedules/complementary/${id}`),
            delete: (id: string | number) => apiUrl(`/schedules/complementary/${id}`),
        },
    },
} satisfies ApiModule
