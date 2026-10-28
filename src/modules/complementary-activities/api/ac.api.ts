import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const acApi: ApiModule = {
    name: 'AC_API',
    api: {
        catalog:    apiUrl('/complementary-activities/catalog'),
        students:   apiUrl('/complementary-activities/students'),
        activities: apiUrl('/complementary-activities/activities'),
        activity:   (id: string | number) => apiUrl(`/complementary-activities/activities/${id}`),
        close:      (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/close`),
        attendees:  (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/attendees`),
        attendee:   (id: string | number, studentId: string | number) =>
            apiUrl(`/complementary-activities/activities/${id}/attendees/${studentId}`),
        schedules:         (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/schedules`),
        scheduleConflicts: (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/schedule-conflicts`),
    },
}

export default acApi
