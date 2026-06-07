import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const processApi: ApiModule = {
    name: 'PROCESS_API',
    api: {
        describe: apiUrl('/process-control'),
        apply:    apiUrl('/process-control/apply'),
    },
}

export default processApi
