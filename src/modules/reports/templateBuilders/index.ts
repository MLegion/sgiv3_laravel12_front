/**
 * Registro de builders de plantilla por configuración (afinador visual).
 * Agregar un nuevo reporte = registrar aquí su TemplateBuilder.
 */
import type { TemplateBuilder } from './types'
import { solicitudBuilder } from './solicitud'

const builders: Record<string, TemplateBuilder> = {
    [solicitudBuilder.code]: solicitudBuilder,
}

export function getTemplateBuilder(code?: string | null): TemplateBuilder | undefined {
    return code ? builders[code] : undefined
}

export function hasTemplateBuilder(code?: string | null): boolean {
    return !!getTemplateBuilder(code)
}

export type { TemplateBuilder, BuilderControl, TemplateConfig } from './types'
