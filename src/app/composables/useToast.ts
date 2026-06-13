import { reactive } from 'vue'

/**
 * Sistema global de notificaciones efímeras (toasts/snackbars).
 *
 * Resuelve el problema sistémico S2 de la auditoría UX: tras crear/actualizar/
 * eliminar el usuario no recibía confirmación y muchos errores se silenciaban.
 *
 * Uso:
 *   const toast = useToast()
 *   toast.success('Aspirante guardado')
 *   toast.error('No se pudo guardar', { title: 'Error' })
 *
 * El estado es un singleton a nivel de módulo: todas las llamadas comparten la
 * misma cola, que `<ToastHost>` (montado una sola vez en AppLayout) renderiza.
 */

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
    id: number
    message: string
    title?: string
    variant: ToastVariant
    /** ms hasta auto-cierre; 0 = persistente (cierre manual). */
    timeout: number
}

export interface ToastOptions {
    title?: string
    /** ms hasta auto-cierre. Default 4000. Usa 0 para que no se cierre solo. */
    timeout?: number
}

const toasts = reactive<ToastItem[]>([])
let seq = 0

const DEFAULT_TIMEOUT = 4000
const ERROR_TIMEOUT = 6000

function push(message: string, variant: ToastVariant, options: ToastOptions = {}): number {
    const id = ++seq
    const fallback = variant === 'error' ? ERROR_TIMEOUT : DEFAULT_TIMEOUT
    const timeout = options.timeout ?? fallback

    toasts.push({ id, message, title: options.title, variant, timeout })

    if (timeout > 0) {
        window.setTimeout(() => dismiss(id), timeout)
    }
    return id
}

function dismiss(id: number): void {
    const i = toasts.findIndex(t => t.id === id)
    if (i !== -1) toasts.splice(i, 1)
}

function clear(): void {
    toasts.splice(0, toasts.length)
}

export function useToast() {
    return {
        toasts,
        success: (message: string, options?: ToastOptions) => push(message, 'success', options),
        error:   (message: string, options?: ToastOptions) => push(message, 'error', options),
        info:    (message: string, options?: ToastOptions) => push(message, 'info', options),
        warning: (message: string, options?: ToastOptions) => push(message, 'warning', options),
        dismiss,
        clear,
    }
}
