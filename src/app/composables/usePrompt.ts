import { reactive } from 'vue'

/**
 * Captura de UN dato accesible y no bloqueante, reutilizable en todo el sistema.
 *
 * Reemplaza al `prompt()` nativo (bloqueante, sin estilo, inaccesible, sin
 * validación de formato). Devuelve una promesa que resuelve con el texto
 * capturado, o `null` si el usuario cancela. Respaldada por un único
 * `<PromptHost>` montado en AppLayout (mismo patrón que useConfirm/useToast).
 *
 * Uso:
 *   const { prompt } = usePrompt()
 *   const motivo = await prompt({ title: 'Rechazar', label: 'Motivo', inputType: 'textarea' })
 *   if (motivo === null) return            // canceló
 *   await api.post(..., { reason: motivo || undefined })
 *
 *   // Requerido + validación nativa (fecha):
 *   const fecha = await prompt({ title: 'Excepción', label: 'Vigente hasta', inputType: 'date', required: true })
 */

export type PromptInputType = 'text' | 'textarea' | 'date' | 'url' | 'number'

export interface PromptOptions {
    title?: string
    /** Etiqueta del campo (asociada al input). */
    label?: string
    /** Texto explicativo opcional sobre el campo. */
    message?: string
    inputType?: PromptInputType
    placeholder?: string
    initialValue?: string
    /** Si true, no se puede aceptar vacío. */
    required?: boolean
    confirmText?: string
    cancelText?: string
    /** Validación extra: retorna mensaje de error, o null/'' si es válido. */
    validate?: (value: string) => string | null
}

interface PromptState {
    open: boolean
    title: string
    label: string
    message: string
    inputType: PromptInputType
    placeholder: string
    value: string
    required: boolean
    confirmText: string
    cancelText: string
    error: string
    validate: ((value: string) => string | null) | null
    resolve: ((value: string | null) => void) | null
}

const state = reactive<PromptState>({
    open: false,
    title: 'Dato requerido',
    label: '',
    message: '',
    inputType: 'text',
    placeholder: '',
    value: '',
    required: false,
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    error: '',
    validate: null,
    resolve: null,
})

function settle(value: string | null): void {
    const r = state.resolve
    state.resolve = null
    state.open = false
    state.error = ''
    r?.(value)
}

export function usePrompt() {
    function prompt(options: PromptOptions = {}): Promise<string | null> {
        // si había uno abierto sin resolver, lo cancelamos
        if (state.resolve) settle(null)
        return new Promise<string | null>((resolve) => {
            state.title       = options.title       ?? 'Dato requerido'
            state.label       = options.label       ?? ''
            state.message     = options.message     ?? ''
            state.inputType   = options.inputType   ?? 'text'
            state.placeholder = options.placeholder ?? ''
            state.value       = options.initialValue ?? ''
            state.required    = options.required    ?? false
            state.confirmText = options.confirmText ?? 'Aceptar'
            state.cancelText  = options.cancelText  ?? 'Cancelar'
            state.validate    = options.validate    ?? null
            state.error       = ''
            state.resolve     = resolve
            state.open        = true
        })
    }
    return { prompt }
}

/** Uso interno de <PromptHost>. */
export function _promptHost() {
    return {
        state,
        accept: () => {
            const v = state.value.trim()
            if (state.required && !v) {
                state.error = 'Este campo es obligatorio.'
                return
            }
            if (v && state.validate) {
                const err = state.validate(v)
                if (err) { state.error = err; return }
            }
            settle(v)
        },
        cancel: () => settle(null),
    }
}
