/**
 * usePersistentRef — un Ref que se conserva en localStorage entre refreshes.
 *
 * Pensado para "opciones de vista" que NO deben ir en la URL (filtros de página,
 * preferencias de UI). Para filtros que sí convenga compartir/navegar, usa
 * `useQueryFilter` (query string) en su lugar.
 *
 * - Lee el valor inicial de localStorage al crear; si no hay, usa el default.
 * - Cada cambio se serializa a JSON y se guarda. Un valor null/undefined/''
 *   borra la clave para no dejar basura.
 *
 * Uso:
 *   const roleFilter = usePersistentRef('college.users.roleFilter', '')
 *   const onlyActive = usePersistentRef('college.users.onlyActive', true)
 */

import { ref, watch, type Ref } from 'vue'

export function usePersistentRef<T>(
    key: string,
    defaultValue: T,
    storage: Storage = localStorage,
): Ref<T> {
    let initial = defaultValue
    try {
        const raw = storage.getItem(key)
        if (raw !== null) initial = JSON.parse(raw) as T
    } catch {
        /* clave corrupta o storage no disponible → default */
    }

    const value = ref<T>(initial) as Ref<T>

    watch(value, (v) => {
        try {
            if (v === null || v === undefined || v === '') storage.removeItem(key)
            else storage.setItem(key, JSON.stringify(v))
        } catch {
            /* storage lleno o bloqueado → ignorar */
        }
    }, { deep: true })

    return value
}
