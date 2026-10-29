import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const acApi: ApiModule = {
    name: 'AC_API',
    api: {
        catalog:     apiUrl('/complementary-activities/catalog'),
        groups:      apiUrl('/complementary-activities/groups'),
        instructors: apiUrl('/complementary-activities/instructors'),
        groupTutoringRequirements: apiUrl('/complementary-activities/group-tutoring-requirements'),
        generateGroupTutoring:     apiUrl('/complementary-activities/group-tutoring-requirements/generate'),
        students:    apiUrl('/complementary-activities/students'),
        activities: apiUrl('/complementary-activities/activities'),
        activity:   (id: string | number) => apiUrl(`/complementary-activities/activities/${id}`),
        close:      (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/close`),
        attendees:  (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/attendees`),
        attendee:   (id: string | number, studentId: string | number) =>
            apiUrl(`/complementary-activities/activities/${id}/attendees/${studentId}`),
        creditAttendee: (id: string | number, studentId: string | number) =>
            apiUrl(`/complementary-activities/activities/${id}/attendees/${studentId}/credit`),
        schedules:         (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/schedules`),
        scheduleConflicts: (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/schedule-conflicts`),
    },
}

export default acApi
