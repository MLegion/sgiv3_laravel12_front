/**
 * Badges de conteo en el menú lateral.
 *
 * Cada módulo puede aportar una "fuente de badge" creando un archivo
 *   src/modules/**​/menu-badges/*.badge.ts
 * que exporte por default un objeto `MenuBadgeSource`. Las fuentes se
 * autodescubren aquí (import.meta.glob), igual que los dashboards.
 *
 * Para evitar llamadas inútiles (y 403) cuando el usuario no tiene el menú,
 * una fuente solo se consulta si AL MENOS uno de sus `codes` está visible en
 * el menú cargado del usuario.
 */
export interface MenuBadgeSource {
    /** Códigos de item de menú que esta fuente puede "badgear". */
    codes: string[]
    /** Devuelve un mapa { codigoMenu: conteo }. Debe atrapar sus propios errores. */
    resolve: () => Promise<Record<string, number>>
}

const sources: MenuBadgeSource[] = []

const modules = import.meta.glob('@/modules/**/menu-badges/*.badge.ts', { eager: true })
for (const mod of Object.values(modules) as Array<{ default?: MenuBadgeSource }>) {
    const src = mod?.default
    if (src && Array.isArray(src.codes) && typeof src.resolve === 'function') {
        sources.push(src)
    }
}

export async function resolveMenuBadges(visibleCodes: Set<string>): Promise<Record<string, number>> {
    const active = sources.filter(s => s.codes.some(c => visibleCodes.has(c)))
    if (active.length === 0) return {}

    const merged: Record<string, number> = {}
    const results = await Promise.allSettled(active.map(s => s.resolve()))
    for (const r of results) {
        if (r.status === 'fulfilled' && r.value) Object.assign(merged, r.value)
    }
    return merged
}
