/** Descriptores para el afinador visual de plantillas por configuración. */

export type ControlType = 'number' | 'text' | 'widthArray'

export interface BuilderControl {
    key: string
    label: string
    type: ControlType
    group?: string
    /** number */
    min?: number
    max?: number
    step?: number
    unit?: string
    /** widthArray: etiquetas de cada columna (define también la cantidad) */
    columns?: string[]
    hint?: string
}

export type TemplateConfig = Record<string, unknown>

export interface TemplateBuilder {
    /** Código del reporte (RPT.*) al que aplica. */
    code: string
    title: string
    /** Configuración inicial editable. */
    defaultConfig: TemplateConfig
    /** Datos de ejemplo para la vista previa (mismas variables que producen los DAOs). */
    sampleData: Record<string, unknown>
    /** Controles que se muestran en el panel del afinador. */
    controls: BuilderControl[]
    /** Construye los bytes del .docx a partir de la configuración. */
    build(config: TemplateConfig): ArrayBuffer
}
