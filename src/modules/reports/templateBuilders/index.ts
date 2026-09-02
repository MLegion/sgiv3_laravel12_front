/**
 * Registro de builders de plantilla por configuración (afinador visual).
 * Agregar un nuevo reporte = registrar aquí su TemplateBuilder.
 */
import type { TemplateBuilder } from './types'

// Afinador visual desregistrado: la plantilla oficial de la SOLICITUD es el
// .docx que sube el usuario (el seeder ya no lo instala/sobrescribe), así que
// el builder generado quedó obsoleto. Registrar aquí un code reactiva su botón
// "Afinar plantilla" en la lista de reportes.
const builders: Record<string, TemplateBuilder> = {}

export function getTemplateBuilder(code?: string | null): TemplateBuilder | undefined {
    return code ? builders[code] : undefined
}

export function hasTemplateBuilder(code?: string | null): boolean {
    return !!getTemplateBuilder(code)
}

export type { TemplateBuilder, BuilderControl, TemplateConfig } from './types'
