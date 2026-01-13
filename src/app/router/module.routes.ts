import type { RouteRecordRaw } from 'vue-router'

/**
 * Escanea automáticamente todos los archivos que coincidan con el patrón:
 * src/modules/{nombre_modulo}/routes/{nombre}.routes.ts
 * * Se utiliza 'eager: true' para asegurar que las rutas estén disponibles
 * inmediatamente al arrancar la aplicación.
 */
const modules = import.meta.glob(
    '@/modules/**/routes/*.routes.ts',
    { eager: true }
)

const moduleRoutes: RouteRecordRaw[] = []
/**
 * Procesa cada módulo encontrado para extraer sus rutas.
 */
for (const path in modules) {
    try {
        const mod = modules[path] as { default?: RouteRecordRaw[] }

        // Validamos que el archivo exporte un default y que este sea un arreglo
        if (mod && Array.isArray(mod.default)) {
            moduleRoutes.push(...mod.default)

            // Log de depuración en entorno de desarrollo
            if (import.meta.env.DEV) {
                console.log(`[Router Discovery] Cargadas ${mod.default.length} rutas desde: ${path}`)
            }
        } else {
            console.warn(`[Router Discovery] El archivo ${path} no exporta un arreglo de rutas por defecto.`)
        }
    } catch (error) {
        console.error(`[Router Discovery] Error crítico cargando rutas de ${path}:`, error)
    }
}

/**
 * Ordenamiento opcional por prioridad.
 * Si una ruta tiene meta: { priority: number }, se ordena de mayor a menor.
 * Esto evita que rutas genéricas capturen peticiones destinadas a rutas más específicas.
 */
moduleRoutes.sort((a, b) => {
    const priorityA = (a.meta?.priority as number) || 0
    const priorityB = (b.meta?.priority as number) || 0
    return priorityB - priorityA
})

/**
 * Exportamos la lista consolidada de rutas de todos los módulos.
 * Estas se inyectarán como hijos del AppLayout en el router principal.
 */
export default moduleRoutes
