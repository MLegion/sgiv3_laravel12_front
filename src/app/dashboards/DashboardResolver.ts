import type { Component } from 'vue'
import type { DashboardDefinition } from '@/shared/types/dashboard'


/**
 * Escanea automáticamente todos los archivos que coincidan con el patrón:
 * src/modules/** /dashboards/*.dashboard.ts
 * * Cada archivo debe exportar por defecto un objeto que cumpla con DashboardDefinition.
 */
const dashboardModules = import.meta.glob(
    '@/modules/**/dashboards/*.dashboard.ts',
    { eager: true }
)

const registeredDashboards: Record<string, DashboardDefinition> = {}

/**
 * Procesa y registra los dashboards encontrados en los módulos.
 */
for (const path in dashboardModules) {
    try {
        const mod = dashboardModules[path] as { default?: DashboardDefinition }
        const definition = mod.default

        if (definition && definition.type && definition.component) {
            // Si hay duplicados, prevalece el de mayor prioridad
            const existing = registeredDashboards[definition.type]
            if (!existing || (definition.priority || 0) > (existing.priority || 0)) {
                registeredDashboards[definition.type] = definition

                if (import.meta.env.DEV) {
                    console.log(`[Dashboard Discovery] Registrado tipo "${definition.type}" desde: ${path}`)
                }
            }
        } else {
            console.warn(`[Dashboard Discovery] El archivo ${path} no exporta una definición de dashboard válida.`)
        }
    } catch (error) {
        console.error(`[Dashboard Discovery] Error cargando dashboard de ${path}:`, error)
    }
}

/**
 * Resuelve el componente de dashboard correspondiente.
 * * @param type El tipo de dashboard solicitado (ej. 'admin', 'student', 'superadmin')
 * @returns Una promesa que resuelve al componente de Vue o un componente por defecto.
 */
export async function resolveDashboard(type: string): Promise<Component> {
    const dashboard = registeredDashboards[type] || registeredDashboards['default']

    if (!dashboard) {
        // Fallback preventivo si no hay ningún dashboard registrado
        return (await import('@/app/dashboards/DefaultDashboard.vue')).default
    }

    try {
        // Los componentes se cargan de forma perezosa (lazy) según la definición
        const component = await dashboard.component()
        return component.default || component
    } catch (error) {
        console.error(`[Dashboard Resolver] Error al cargar el componente para "${type}":`, error)
        return (await import('@/app/pages/ServerErrorPage.vue')).default
    }
}

/**
 * Retorna la lista de tipos de dashboards disponibles.
 */
export function getAvailableDashboards(): string[] {
    return Object.keys(registeredDashboards)
}
