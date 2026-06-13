import { reactive } from 'vue'

/**
 * Confirmación accesible y no bloqueante, reutilizable en todo el sistema.
 *
 * Reemplaza al `confirm()` nativo (bloqueante, sin estilo, inaccesible). Devuelve
 * una promesa que resuelve `true`/`false`, respaldada por un único `<ConfirmHost>`
 * montado en AppLayout (igual patrón que useToast/ToastHost).
 *
 * Uso:
 *   const { confirm } = useConfirm()
 *   if (!await confirm({ title: 'Eliminar', message: '¿Seguro?', variant: 'danger' })) return
 *   // ...proceder
 */

export type ConfirmVariant = 'warning' | 'info' | 'success' | 'danger'

export interface ConfirmOptions {
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    variant?: ConfirmVariant
}

interface ConfirmState extends Required<Omit<ConfirmOptions, 'message'>> {
    open: boolean
    message: string
    resolve: ((value: boolean) => void) | null
}

const state = reactive<ConfirmState>({
    open: false,
    title: 'Confirmar',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'warning',
    resolve: null,
})

function settle(value: boolean): void {
    const r = state.resolve
    state.resolve = null
    state.open = false
    r?.(value)
}

export function useConfirm() {
    function confirm(options: ConfirmOptions = {}): Promise<boolean> {
        // si había uno abierto sin resolver, lo cancelamos
        if (state.resolve) settle(false)
        return new Promise<boolean>((resolve) => {
            state.title       = options.title       ?? 'Confirmar'
            state.message     = options.message     ?? ''
            state.confirmText = options.confirmText ?? 'Confirmar'
            state.cancelText  = options.cancelText  ?? 'Cancelar'
            state.variant     = options.variant     ?? 'warning'
            state.resolve     = resolve
            state.open        = true
        })
    }
    return { confirm }
}

/** Uso interno de <ConfirmHost>. */
export function _confirmHost() {
    return {
        state,
        accept: () => settle(true),
        reject: () => settle(false),
    }
}
