import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const advisingApi: ApiModule = {
    name: 'ADVISING_API',
    api: {
        sessions: {
            myActivePeriod:   apiUrl('/advising/my-active-period'),
            myCurrent:        apiUrl('/advising/my-current'),
            myContactInfo:    apiUrl('/advising/me/contact-info'),
            myAvatar:         apiUrl('/advising/me/avatar'),
            uploadMyPhoto:    apiUrl('/advising/me/photo'),
            create:           apiUrl('/advising/sessions'),
            byId:             (id: string | number) => apiUrl(`/advising/sessions/${id}`),
            updateItems:      (id: string | number) => apiUrl(`/advising/sessions/${id}/items`),
            upsertSingleItem: (id: string | number) => apiUrl(`/advising/sessions/${id}/items/single`),
            removeSingleItem: (id: string | number) => apiUrl(`/advising/sessions/${id}/items/single`),
            submit:           (id: string | number) => apiUrl(`/advising/sessions/${id}/submit`),
            cancel:           (id: string | number) => apiUrl(`/advising/sessions/${id}/cancel`),
            reopen:           (id: string | number) => apiUrl(`/advising/sessions/${id}/reopen`),
            pendingReview:    apiUrl('/advising/sessions/pending-review'),
            take:             (id: string | number) => apiUrl(`/advising/sessions/${id}/take`),
            release:          (id: string | number) => apiUrl(`/advising/sessions/${id}/release`),
            updateItem:       (id: string | number, itemId: string | number) => apiUrl(`/advising/sessions/${id}/items/${itemId}`),
            approve:          (id: string | number) => apiUrl(`/advising/sessions/${id}/approve`),
            reject:           (id: string | number) => apiUrl(`/advising/sessions/${id}/reject`),
            reopenApproved:   (id: string | number) => apiUrl(`/advising/sessions/${id}/reopen-approved`),
            override:         (id: string | number) => apiUrl(`/advising/sessions/${id}/override`),
            listAll:          apiUrl('/advising/sessions'),
        },
        students: {
            kardex:       (studentId: string | number) => apiUrl(`/advising/students/${studentId}/kardex`),
            curriculum:   (studentId: string | number) => apiUrl(`/advising/students/${studentId}/curriculum`),
            avatar:       (studentId: string | number) => apiUrl(`/advising/students/${studentId}/avatar`),
        },
        phases: {
            list:   apiUrl('/advising/phases'),
            toggle: apiUrl('/advising/phases/toggle'),
        },
    },
}

export default advisingApi
