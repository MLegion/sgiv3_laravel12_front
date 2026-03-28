import { ref } from 'vue'
import { api } from '@/shared/services/api'

export interface GeoSettlement {
    id: number
    colony: string
    type: string | null
}

export interface GeoLookupResult {
    postalCode: string
    state: { id: number; name: string }
    municipality: { id: number; name: string }
    city: string | null
    settlements: GeoSettlement[]
}

export function usePostalCodeLookup() {
    const loading  = ref(false)
    const error    = ref<string | null>(null)
    const result   = ref<GeoLookupResult | null>(null)

    async function lookup(cp: string) {
        if (cp.length !== 5) {
            result.value = null
            error.value  = null
            return
        }

        loading.value = true
        error.value   = null
        result.value  = null

        try {
            const { data } = await api.get(`/api/v1/geo/postal-code/${cp}`)
            result.value = data
        } catch {
            error.value = 'Código postal no encontrado.'
        } finally {
            loading.value = false
        }
    }

    function reset() {
        result.value = null
        error.value  = null
    }

    return { lookup, reset, loading, error, result }
}
