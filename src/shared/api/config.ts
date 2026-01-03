export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL ?? '',
    VERSION: 'v1',
}

export function apiUrl(path: string): string {
    return `/api/${API_CONFIG.VERSION}${path}`
}
