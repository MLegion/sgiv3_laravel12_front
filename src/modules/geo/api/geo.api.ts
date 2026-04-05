export default {
    name: 'GEO_API',
    api: {
        states:          '/api/v1/geo/states',
        municipalities:  (stateId: number) => `/api/v1/geo/states/${stateId}/municipalities`,
        byPostalCode:    (cp: string) => `/api/v1/geo/postal-code/${cp}`,
    },
}
