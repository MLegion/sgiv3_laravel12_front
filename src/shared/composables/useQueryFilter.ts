/**
 * useQueryFilter — sincroniza un Ref con un parámetro del query string.
 *
 * - Lee el valor inicial desde la URL al montar.
 * - Cuando el Ref cambia, escribe en la URL (router.replace, no agrega historial).
 * - Cuando la URL cambia (back/forward, link compartido), actualiza el Ref.
 *
 * Batching: si varios filtros se modifican en el mismo tick (p. ej. al
 * resetear todos al desbloquear el periodo en SubjectPackagePage), se acumulan
 * en una sola escritura vía nextTick. Sin esto cada watcher leería un
 * `route.query` viejo y el último ganaría sobreescribiendo a los anteriores.
 *
 * Uso:
 *   const periodId = useQueryFilter('period', null, QueryFilters.number)
 *   const locked   = useQueryFilter('locked', false, QueryFilters.bool)
 */

import { ref, watch, nextTick, type Ref } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'

export interface QueryFilterSerializer<T> {
    /** De query string (string | null) → valor tipado. */
    read: (raw: string | null) => T
    /** De valor tipado → string. Devolver `null` elimina el parámetro de la URL. */
    write: (value: T) => string | null
}

export const QueryFilters = {
    number: {
        read:  (raw: string | null) => (raw == null || raw === '' ? null : Number(raw)),
        write: (v: number | null)   => (v == null ? null : String(v)),
    } as QueryFilterSerializer<number | null>,

    string: {
        read:  (raw: string | null) => (raw == null || raw === '' ? null : raw),
        write: (v: string | null)   => (v == null || v === '' ? null : v),
    } as QueryFilterSerializer<string | null>,

    bool: {
        read:  (raw: string | null) => raw === '1' || raw === 'true',
        write: (v: boolean)         => (v ? '1' : null),
    } as QueryFilterSerializer<boolean>,
}

/* ── Estado de batching compartido entre todas las instancias ───────────── */
let pendingChanges: Record<string, string | null> = {}
let flushScheduled = false

function pickFirst(raw: unknown): string | null {
    if (raw == null) return null
    if (Array.isArray(raw)) return (raw[0] as string | null) ?? null
    return raw as string
}

export function useQueryFilter<T>(
    name: string,
    defaultValue: T,
    serializer: QueryFilterSerializer<T>,
): Ref<T> {
    const route  = useRoute()
    const router = useRouter()

    // Valor inicial: leer URL; si no está, usar default.
    const initialRaw = pickFirst(route.query[name])
    const value = ref<T>(
        initialRaw != null ? serializer.read(initialRaw) : defaultValue,
    ) as Ref<T>

    function scheduleFlush() {
        if (flushScheduled) return
        flushScheduled = true
        nextTick(() => {
            flushScheduled = false
            const next: LocationQuery = { ...route.query }
            for (const [k, v] of Object.entries(pendingChanges)) {
                if (v == null) delete next[k]
                else           next[k] = v
            }
            pendingChanges = {}
            // navigationDuplicated: ignorar errores típicos del replace
            router.replace({ query: next }).catch(() => { /* noop */ })
        })
    }

    // Ref → URL (con batching).
    watch(value, (newVal) => {
        pendingChanges[name] = serializer.write(newVal)
        scheduleFlush()
    }, { deep: false })

    // URL → Ref (back/forward, link pegado).
    watch(() => route.query[name], (raw) => {
        const next = raw != null ? serializer.read(pickFirst(raw)) : defaultValue
        // Evita ciclo: solo aplicar si difiere realmente.
        if (JSON.stringify(value.value) !== JSON.stringify(next)) {
            value.value = next
        }
    })

    return value
}
