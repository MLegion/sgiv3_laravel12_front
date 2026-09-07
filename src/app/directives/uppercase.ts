import type { Directive } from 'vue'

/**
 * v-uppercase: fuerza mayúsculas en un <input> de texto y sincroniza el v-model.
 * Se aplica al propio input o al primer <input> descendiente. Ignora type=email.
 */
export const uppercase: Directive<HTMLElement> = {
    mounted(el) {
        const input = (el instanceof HTMLInputElement ? el : el.querySelector('input')) as HTMLInputElement | null
        if (! input || input.type === 'email') return

        input.addEventListener('input', () => {
            const upper = input.value.toUpperCase()
            if (upper !== input.value) {
                const pos = input.selectionStart
                input.value = upper
                if (pos !== null) input.setSelectionRange(pos, pos)
                // Re-emite 'input' para que v-model tome el valor en mayúsculas.
                input.dispatchEvent(new Event('input', { bubbles: true }))
            }
        })
    },
}
