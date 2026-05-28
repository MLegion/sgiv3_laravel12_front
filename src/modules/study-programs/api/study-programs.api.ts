import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'STUDY_PROGRAMS_API',
    api: {
        studyPrograms: {
            list:       apiUrl('/study-programs'),
            byId:       (id: string | number) => apiUrl(`/study-programs/${id}`),
            create:     apiUrl('/study-programs'),
            update:     (id: string | number) => apiUrl(`/study-programs/${id}`),
            delete:     (id: string | number) => apiUrl(`/study-programs/${id}`),
            submit:     (id: string | number) => apiUrl(`/study-programs/${id}/submit`),
            approve:    (id: string | number) => apiUrl(`/study-programs/${id}/approve`),
            promote:    (id: string | number) => apiUrl(`/study-programs/${id}/promote`),
            import:     apiUrl('/study-programs/import'),
            forSubject: (subjectId: string | number) => apiUrl(`/study-programs/for-subject/${subjectId}`),
        },
    },
} satisfies ApiModule
