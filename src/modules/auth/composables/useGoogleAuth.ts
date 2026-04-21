/**
 * Wrapper mínimo para Google Identity Services (GIS).
 * Carga el script una sola vez y expone requestAccessToken() que abre popup
 * y retorna el access_token para enviarlo al backend.
 *
 * El clientId se pasa en runtime (cada college tiene el suyo — multi-tenant).
 */

let gisLoaded: Promise<void> | null = null

function loadGis(): Promise<void> {
    if (gisLoaded) return gisLoaded

    gisLoaded = new Promise((resolve, reject) => {
        if ((window as any).google?.accounts?.oauth2) {
            resolve()
            return
        }
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services.'))
        document.head.appendChild(script)
    })

    return gisLoaded
}

export interface GoogleTokenResult {
    access_token: string
    hd?: string  // hosted domain retornado por Google
}

/**
 * Abre el popup de Google y resuelve con el access_token.
 * @param clientId OAuth Web Client ID del college (multi-tenant).
 * @param hostedDomain restringe cuentas al dominio Workspace (hd=...).
 */
export async function requestGoogleAccessToken(
    clientId: string,
    hostedDomain?: string,
): Promise<GoogleTokenResult> {
    if (!clientId) {
        throw new Error('El college no tiene configurado el Google Client ID.')
    }
    await loadGis()

    return new Promise((resolve, reject) => {
        const g = (window as any).google
        const client = g.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile',
            hd: hostedDomain,        // hint de dominio
            prompt: '',              // no forzar consent si ya está autorizado
            callback: (resp: any) => {
                if (resp.error) {
                    reject(new Error(resp.error_description || resp.error))
                    return
                }
                resolve({
                    access_token: resp.access_token,
                    hd: resp.hd,
                })
            },
            error_callback: (err: any) => {
                reject(new Error(err?.message || 'Flujo Google cancelado.'))
            },
        })
        client.requestAccessToken()
    })
}
