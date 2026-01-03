import { apiUrl } from './config'

export const COLLEGE_API = {
    list: apiUrl('/colleges'),
    byId: (id: string | number) => apiUrl(`/colleges/${id}`),
}
