import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const titulacionApi: ApiModule = {
    name: 'TITULACION_API',
    api: {
        me:     apiUrl('/titulacion/me'),
        myJury: apiUrl('/titulacion/me/jury'),
        options: apiUrl('/titulacion/options'),

        records: {
            list:          apiUrl('/titulacion/records'),
            filterOptions: apiUrl('/titulacion/records/filter-options'),
            create:        apiUrl('/titulacion/records'),
            byId:  (id: string | number) => apiUrl(`/titulacion/records/${id}`),
            update:(id: string | number) => apiUrl(`/titulacion/records/${id}`),
            drop:  (id: string | number) => apiUrl(`/titulacion/records/${id}/drop`),
            jury:  (id: string | number) => apiUrl(`/titulacion/records/${id}/jury`),
            removeJury: (id: string | number, juryId: string | number) => apiUrl(`/titulacion/records/${id}/jury/${juryId}`),
            scheduleAct:(id: string | number) => apiUrl(`/titulacion/records/${id}/acts`),
        },

        eligibleResidencies: (studentId: string | number) => apiUrl(`/titulacion/students/${studentId}/eligible-residencies`),

        acts: {
            list:             apiUrl('/titulacion/acts'),
            checkAvailability: apiUrl('/titulacion/acts/check-availability'),
            reschedule: (actId: string | number) => apiUrl(`/titulacion/acts/${actId}`),
            cancel:     (actId: string | number) => apiUrl(`/titulacion/acts/${actId}/cancel`),
            conclude:   (actId: string | number) => apiUrl(`/titulacion/acts/${actId}/conclude`),
        },

        rooms: {
            list: apiUrl('/titulacion/rooms'),
            week: (placeId: string | number) => apiUrl(`/titulacion/rooms/${placeId}/week`),
            set:  (placeId: string | number) => apiUrl(`/titulacion/rooms/${placeId}`),
        },
    },
}

export default titulacionApi
