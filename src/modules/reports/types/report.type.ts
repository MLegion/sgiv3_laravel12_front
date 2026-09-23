export interface ReportDao {
    id:         number
    name:       string
    type:       number
    varName:    string
    preScript:  string | null
    postScript: string | null
    dataSource: string
    status:     boolean
}

export interface Report {
    id:                    number
    collegeId:             number | null
    name:                  string
    code:                  string
    description:           string | null
    templatePath:          string | null
    templateOriginalName:  string | null
    hasTemplate:           boolean
    isTemplate:            boolean
    templateId:            number | null
    status:                boolean
    daos?:                 ReportDao[]
    charts?:               ChartSpec[] | null
    clientScript?:         string | null
    createdAt:             string
    updatedAt:             string
}

/** Definición de una gráfica del reporte (columna reports.charts). */
export interface ChartSpec {
    var:     string
    type?:   'bar' | 'line'
    source:  string
    x:       string
    y:       string
    yMax?:   number | null
    xTitle?: string | null
    yTitle?: string | null
    color?:  string | null
    title?:  string | null
    tickFontSize?:  number | null   // tamaño de fuente de las etiquetas de los ejes (X/Y)
    titleFontSize?: number | null   // tamaño de fuente de los títulos de los ejes
}
