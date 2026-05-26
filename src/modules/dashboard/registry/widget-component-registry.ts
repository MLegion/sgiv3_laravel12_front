import type { Component } from 'vue'

/**
 * Cada widget concreto se registra exportando por defecto un objeto
 * `{ id, component }` desde `modules/<modulo>/widgets/*.widget.ts`.
 * Mismo patrón de auto-discovery que `.api.ts` y `.dashboard.ts`.
 */
export interface WidgetComponentDefinition {
    id: string
    component: Component
    /**
     * Si true, el widget renderiza un panel interno de configuración cuando
     * recibe `view='settings'`. WidgetCard usa este flag para decidir si
     * mostrar el botón engranaje.
     */
    hasSettings?: boolean
}

const modules = import.meta.glob<{ default: WidgetComponentDefinition }>(
    '@/modules/**/widgets/*.widget.ts',
    { eager: true },
)

const registry: Record<string, WidgetComponentDefinition> = {}

for (const path in modules) {
    const def = modules[path]?.default
    if (!def || !def.id || !def.component) {
        console.warn(`[Widget Registry] definición inválida en ${path}`)
        continue
    }
    if (registry[def.id]) {
        console.warn(`[Widget Registry] id duplicado "${def.id}" en ${path}`)
        continue
    }
    registry[def.id] = def
}

export function resolveWidgetComponent(id: string): Component | null {
    return registry[id]?.component ?? null
}

export function widgetHasSettings(id: string): boolean {
    return registry[id]?.hasSettings === true
}

export function listRegisteredWidgetIds(): string[] {
    return Object.keys(registry)
}
