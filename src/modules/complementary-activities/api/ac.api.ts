import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const acApi: ApiModule = {
    name: 'AC_API',
    api: {
        catalog:     apiUrl('/complementary-activities/catalog'),

        // Catálogo de actividades estandarizadas (nombres + créditos sugeridos)
        activityCatalog:       apiUrl('/complementary-activities/activity-catalog'),
        activityCatalogItem:   (id: string | number) => apiUrl(`/complementary-activities/activity-catalog/${id}`),
        activeActivityCatalog: apiUrl('/complementary-activities/active-activity-catalog'),
        myMoocCatalog:         apiUrl('/complementary-activities/me/mooc-catalog'),

        // Lugares por categoría (admin del colegio)
        categoryPlaces: apiUrl('/complementary-activities/category-places'),

        // Registro propio de instructores de AC (distinto de docentes)
        acInstructors:     apiUrl('/complementary-activities/ac-instructors'),
        acInstructorItem:  (id: string | number) => apiUrl(`/complementary-activities/ac-instructors/${id}`),

        groups:      apiUrl('/complementary-activities/groups'),
        instructors: apiUrl('/complementary-activities/instructors'),
        personnel:   apiUrl('/complementary-activities/personnel'),
        personnelById: (id: string | number) => apiUrl(`/complementary-activities/personnel/${id}`),
        places:      apiUrl('/complementary-activities/places'),
        placeById:   (id: string | number) => apiUrl(`/complementary-activities/places/${id}`),
        placePool:   apiUrl('/complementary-activities/place-pool'),
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
        reopen:     (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/reopen`),
        destroy:    (id: string | number) => apiUrl(`/complementary-activities/activities/${id}`),
        setInstructor: (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/instructor`),
        setPlace:      (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/place`),
        setInfo:       (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/info`),
        setRules:      (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/rules`),
        academicOffers: apiUrl('/complementary-activities/academic-offers'),
        setEnrollment: (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/enrollment`),
        enrollmentWindow: apiUrl('/complementary-activities/enrollment-window'),
        // Portal del alumno
        myActivities: apiUrl('/complementary-activities/me/activities'),
        selfEnroll:   (id: string | number) => apiUrl(`/complementary-activities/me/activities/${id}/enroll`),
        selfDrop:     (id: string | number) => apiUrl(`/complementary-activities/me/activities/${id}/drop`),
        occupancy:     (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/occupancy`),
        attendees:  (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/attendees`),
        attendee:   (id: string | number, studentId: string | number) =>
            apiUrl(`/complementary-activities/activities/${id}/attendees/${studentId}`),
        creditAttendee: (id: string | number, studentId: string | number) =>
            apiUrl(`/complementary-activities/activities/${id}/attendees/${studentId}/credit`),
        schedules:         (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/schedules`),
        scheduleBlock:     (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/schedule-blocks`),
        scheduleBlockItem: (id: string | number, blockId: string | number) => apiUrl(`/complementary-activities/activities/${id}/schedule-blocks/${blockId}`),
        scheduleConflicts: (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/schedule-conflicts`),
        availablePlaces:   (id: string | number) => apiUrl(`/complementary-activities/activities/${id}/available-places`),
    },
}

export default acApi
