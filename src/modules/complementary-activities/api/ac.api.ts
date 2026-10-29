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

        // MOOC
        moocPlatforms:       apiUrl('/complementary-activities/mooc/platforms'),
        moocPlatform:        (id: string | number) => apiUrl(`/complementary-activities/mooc/platforms/${id}`),
        moocActivePlatforms: apiUrl('/complementary-activities/mooc/active-platforms'),
        myMoocCompletions:   apiUrl('/complementary-activities/me/mooc-completions'),
        moocSubmit:          apiUrl('/complementary-activities/mooc/completions'),
        moocInbox:           apiUrl('/complementary-activities/mooc/inbox'),
        moocValidate:        (id: string | number) => apiUrl(`/complementary-activities/mooc/completions/${id}/validate`),
        moocReject:          (id: string | number) => apiUrl(`/complementary-activities/mooc/completions/${id}/reject`),
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
