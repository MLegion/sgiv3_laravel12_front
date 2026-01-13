import { setUrl } from './config'
import type { ApiModule, ApiRegistry } from './types'

// 1️⃣ base URL (una sola vez)
setUrl(import.meta.env.VITE_API_URL)

// 2️⃣ autodiscovery de módulos API
const modules = import.meta.glob<ApiModule>(
    '@/modules/**/api/*.api.ts',
    { eager: true, import: 'default' }
)

// 3️⃣ construir registry dinámico
const API = Object.values(modules).reduce<ApiRegistry>((acc, mod) => {
    acc[mod.name] = mod.api
    return acc
}, {})

// 4️⃣ exportar SOLO un contrato estable
export { API }
