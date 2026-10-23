import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const calendarApi: ApiModule = {
    name: 'CALENDAR_API',
    api: {
        // Calendario unificado (solo lectura): eventos agregados de todos los módulos.
        events:  apiUrl('/calendar/events'),
        periods: apiUrl('/calendar/periods'),
    },
}

export default calendarApi
