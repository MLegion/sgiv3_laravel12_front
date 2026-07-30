import { watch, nextTick, onScopeDispose, type Ref } from 'vue'

/**
 * Trampa de foco accesible para drawers/overlays custom que no usan BaseModal.
 * Reproduce el comportamiento de BaseModal: foco inicial dentro del panel,
 * Tab cíclico (con Shift+Tab), Escape para cerrar y restauración del foco
 * previo al cerrar.
 *
 * Uso:
 *   const panel = ref<HTMLElement | null>(null)
 *   useFocusTrap(panel, () => props.open, () => emit('close'))
 * y en el template: <div ref="panel" role="dialog" aria-modal="true" @keydown="...">
 * (el composable ya instala el keydown vía addEventListener sobre el panel).
 */
export function useFocusTrap(
    panel: Ref<HTMLElement | null>,
    isOpen: () => boolean,
    onEscape: () => void,
): void {
    let previouslyFocused: HTMLElement | null = null

    function focusable(): HTMLElement[] {
        if (!panel.value) return []
        return Array.from(
            panel.value.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
        )
    }

    function onKeydown(e: KeyboardEvent): void {
        if (e.key === 'Escape') {
            e.stopPropagation()
            onEscape()
            return
        }
        if (e.key !== 'Tab') return

        const items = focusable()
        if (items.length === 0) {
            e.preventDefault()
            panel.value?.focus()
            return
        }
        const first = items[0]
        const last = items[items.length - 1]
        const active = document.activeElement as HTMLElement | null

        if (e.shiftKey && active === first) {
            e.preventDefault()
            last.focus()
        } else if (!e.shiftKey && active === last) {
            e.preventDefault()
            first.focus()
        }
    }

    let boundPanel: HTMLElement | null = null

    function teardown(restore: boolean): void {
        boundPanel?.removeEventListener('keydown', onKeydown)
        boundPanel = null
        if (restore) {
            previouslyFocused?.focus?.()
        }
        previouslyFocused = null
    }

    watch(isOpen, (open) => {
        if (open) {
            previouslyFocused = document.activeElement as HTMLElement | null
            nextTick(() => {
                boundPanel = panel.value
                boundPanel?.addEventListener('keydown', onKeydown)
                const items = focusable()
                ;(items[0] ?? panel.value)?.focus()
            })
        } else {
            teardown(true)
        }
    }, { immediate: true })

    // Para drawers que el padre monta/desmonta con v-if (sin transición
    // open→false): limpia el listener al destruir el scope y restaura el foco.
    onScopeDispose(() => teardown(true))
}
