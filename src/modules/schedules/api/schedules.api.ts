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
        generation: {
            providerStatus:   apiUrl('/schedules/generation/provider-status'),
            availableCareers: apiUrl('/schedules/generation/available-careers'),
            listRuns:  apiUrl('/schedules/generation/runs'),
            createRun: apiUrl('/schedules/generation/runs'),
            showRun:   (id: string | number) => apiUrl(`/schedules/generation/runs/${id}`),
            promote:   (id: string | number) => apiUrl(`/schedules/generation/runs/${id}/promote`),
            discard:   (id: string | number) => apiUrl(`/schedules/generation/runs/${id}`),
        },
        groupPreferredPlaces: {
            list:    apiUrl('/schedules/group-preferred-places'),
            byGroup: (groupId: string | number) => apiUrl(`/schedules/group-preferred-places/by-group/${groupId}`),
            create:  apiUrl('/schedules/group-preferred-places'),
            update:  (id: string | number) => apiUrl(`/schedules/group-preferred-places/${id}`),
            delete:  (id: string | number) => apiUrl(`/schedules/group-preferred-places/${id}`),
        },
    },
} satisfies ApiModule
