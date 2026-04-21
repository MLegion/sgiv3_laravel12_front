import axios from 'axios'

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        Accept: 'application/json',
    },
})

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

/**
 * 401 handler robusto:
 * - Si estamos dentro de una simulación y el token simulado expira:
 *   restauramos el impersonator_token (del superadmin) y redirigimos a su panel.
 *   Si el backend rechaza también el impersonator_token (ya caducó), hacemos logout completo.
 * - Si no hay simulación, limpia sesión y lleva a login.
 *
 * Evita bucles saltando el interceptor para el endpoint de logout/stop-impersonation.
 */
let handling401 = false

api.interceptors.response.use(
    resp => resp,
    async err => {
        if (!err?.response) throw err
        const status = err.response.status
        const url = err.config?.url || ''

        // Solo actuamos en 401 y evitamos recursión
        if (status !== 401 || handling401) throw err
        // No re-procesar el propio stop/logout
        if (/\/(logout|impersonate\/stop)(\?|$)/.test(url)) throw err

        handling401 = true
        try {
            const impToken = localStorage.getItem('impersonator_token')
            const impUser  = localStorage.getItem('impersonator_user')

            if (impToken && impUser) {
                // Estaba en simulación → restaurar sesión original
                localStorage.setItem('token', impToken)
                localStorage.setItem('user', impUser)
                localStorage.setItem('must_change_password', 'false')
                localStorage.removeItem('impersonator_token')
                localStorage.removeItem('impersonator_user')
                localStorage.removeItem('impersonator_info')
                localStorage.removeItem('impersonation_expires_at')

                // Forzar recarga para reiniciar stores con el token válido
                window.location.assign('/superadmin/impersonate')
                return new Promise(() => {})  // nunca resuelve, se recarga página
            }

            // Sin impersonación → logout completo
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('must_change_password')
            localStorage.removeItem('selected_college')

            // Evita redirigir si ya estamos en login
            if (!/\/auth\//.test(window.location.pathname)) {
                window.location.assign('/auth/login')
                return new Promise(() => {})
            }
        } finally {
            // dejamos handling401=true permanentemente si hubo redirect;
            // se resetea naturalmente al recargar. Si llegamos acá sin redirect,
            // reset manual:
            handling401 = false
        }

        throw err
    }
)
