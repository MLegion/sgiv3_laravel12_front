/**
 * Builder de la plantilla oficial "SOLICITUD DE ASIGNATURA A IMPARTIR" (RPT.SOLICITUD_MATERIA)
 * parametrizado por configuración, para el afinador visual en caliente.
 *
 * Es el equivalente TypeScript del generador OOXML del backend
 * (app-modules/reports/resources/report-templates). Al Guardar, el afinador
 * sube el .docx resultante al endpoint de plantilla del reporte.
 */
import { createOoxml, packDocx, letterSectPr } from './ooxml'
import type { BuilderControl, TemplateBuilder, TemplateConfig } from './types'

interface SolicitudConfig {
    fontFamily: string
    bodyPt: number      // fuente del cuerpo (datos + tablas)
    titlePt: number     // fuente del título institucional
    blankRows: number   // filas en blanco bajo la tabla 1
    cellMargin: number  // padding izq/der de celda (twips)
    spBefore: number    // espaciado antes de párrafo
    spAfter: number     // espaciado después de párrafo
    logoText: string
    institution: string
    title: string
    datosWidths: number[]        // 4 columnas
    materiasWidths: number[]     // 9 columnas
    impartidasWidths: number[]   // 4 columnas
}

const HDR = 'DCE6F1'   // sombreado de encabezados de tabla
const LBL = 'F2F2F2'   // sombreado de etiquetas

export const defaultSolicitudConfig: SolicitudConfig = {
    fontFamily: 'Arial',
    bodyPt: 8,
    titlePt: 10,
    blankRows: 0,   // el post_script pad_rows del DAO rellena hasta el mínimo (10 materias)
    cellMargin: 60,
    spBefore: 10,
    spAfter: 10,
    logoText: 'ITSTB',
    institution: 'INSTITUTO TECNOLÓGICO SUPERIOR DE TIERRA BLANCA',
    title: 'SOLICITUD DE ASIGNATURA A IMPARTIR ({modalidad})',
    datosWidths: [2400, 2113, 2400, 2113],
    materiasWidths: [500, 1050, 2650, 1150, 500, 500, 550, 500, 1126],
    impartidasWidths: [1500, 3500, 1800, 2226],
}

export const solicitudControls: BuilderControl[] = [
    { group: 'Fuente', key: 'bodyPt', label: 'Tamaño del cuerpo', type: 'number', min: 6, max: 12, step: 0.5, unit: 'pt' },
    { group: 'Fuente', key: 'titlePt', label: 'Tamaño del título', type: 'number', min: 8, max: 16, step: 0.5, unit: 'pt' },
    { group: 'Datos (grid superior)', key: 'datosWidths', label: 'Anchos de columna', type: 'widthArray', columns: ['Etiqueta', 'Valor', 'Etiqueta', 'Valor'] },
    {
        group: 'Tabla 1 · Materias solicitadas', key: 'materiasWidths', label: 'Anchos de columna', type: 'widthArray',
        columns: ['No', 'Clave', 'Nombre', 'Carrera', 'HP', 'HT', 'HTo', 'Cr', 'Grupos'],
    },
    { group: 'Tabla 1 · Materias solicitadas', key: 'blankRows', label: 'Filas en blanco', type: 'number', min: 0, max: 15, step: 1 },
    {
        group: 'Tabla 2 · Impartidas', key: 'impartidasWidths', label: 'Anchos de columna', type: 'widthArray',
        columns: ['Clave', 'Nombre', 'Carrera', 'Periodo'],
    },
    { group: 'Espaciado', key: 'cellMargin', label: 'Padding de celda', type: 'number', min: 20, max: 200, step: 10, unit: 'twips' },
    { group: 'Espaciado', key: 'spBefore', label: 'Espacio antes', type: 'number', min: 0, max: 80, step: 5, unit: 'twips' },
    { group: 'Espaciado', key: 'spAfter', label: 'Espacio después', type: 'number', min: 0, max: 80, step: 5, unit: 'twips' },
    { group: 'Textos', key: 'logoText', label: 'Texto del logo', type: 'text' },
    { group: 'Textos', key: 'institution', label: 'Institución', type: 'text' },
    { group: 'Textos', key: 'title', label: 'Título (usa {modalidad})', type: 'text' },
]

/** Rellena un arreglo hasta `n` con filas vacías (misma forma que el post_script pad_rows del DAO). */
function padSample<T extends Record<string, unknown>>(real: T[], n: number, empty: T): T[] {
    const out = real.slice(0, n)
    while (out.length < n) out.push(empty)
    return out
}

const emptyMateria = { no: '', clave: '', materia: '', carrera: '', hp: '', ht: '', hto: '', cr: '', grupos: '' }
const emptyImpartida = { clave: '', materia: '', carrera: '', periodo: '' }

export const solicitudSampleData: Record<string, unknown> = {
    periodo: 'AGO - DIC 2026', docente: 'ALICE SANTIAGO MORA', num_docente: '285',
    anios_servicio: '13 AÑOS', modalidad: 'ESCOLARIZADA', licenciatura: '', ubicacion: 'TIERRA BLANCA',
    maestria: '', doctorado: '',
    // conteos representativos del resultado con post_script: mín 10 materias, exactamente 18 impartidas
    materias: padSample([
        { no: 1, clave: 'ASD1001', materia: 'AGRONEGOCIOS I', carrera: 'I.I.A.S.', hp: 3, ht: 2, hto: 5, cr: 5, grupos: 1 },
        { no: 2, clave: 'AEF1017', materia: 'ECOLOGIA', carrera: 'I.I.A.S.', hp: 2, ht: 3, hto: 5, cr: 5, grupos: 2 },
        { no: 3, clave: 'ACC0906', materia: 'FUNDAMENTOS DE INVESTIGACION', carrera: 'I.I.A.S.', hp: 2, ht: 2, hto: 4, cr: 4, grupos: 2 },
    ] as Record<string, unknown>[], 10, emptyMateria),
    impartidas: padSample([
        { clave: 'ASD1002', materia: 'AGRONEGOCIOS II', carrera: 'I.I.A.S.', periodo: 'ENE - JUN 2026' },
        { clave: 'ASD1007', materia: 'DLLO.COMUNITARIO', carrera: 'I.I.A.S.', periodo: 'ENE - JUN 2026' },
        { clave: 'ASF1012', materia: 'FISIOLOGIA VEGETAL', carrera: 'I.I.A.S.', periodo: 'AGO - DIC 2025' },
        { clave: 'ACC0906', materia: 'FUND. INVESTIGACION', carrera: 'I.I.A.S.', periodo: 'AGO - DIC 2025' },
    ] as Record<string, unknown>[], 18, emptyImpartida),
}

/** Rellena/normaliza un config parcial contra los defaults. */
function normalize(c: TemplateConfig): SolicitudConfig {
    const d = defaultSolicitudConfig
    const arr = (v: unknown, def: number[]): number[] =>
        Array.isArray(v) && v.length === def.length ? v.map((n) => Math.max(120, Math.round(Number(n) || 0))) : def
    return {
        fontFamily: String(c.fontFamily ?? d.fontFamily),
        bodyPt: Number(c.bodyPt ?? d.bodyPt),
        titlePt: Number(c.titlePt ?? d.titlePt),
        blankRows: Math.max(0, Math.round(Number(c.blankRows ?? d.blankRows))),
        cellMargin: Math.max(0, Math.round(Number(c.cellMargin ?? d.cellMargin))),
        spBefore: Math.max(0, Math.round(Number(c.spBefore ?? d.spBefore))),
        spAfter: Math.max(0, Math.round(Number(c.spAfter ?? d.spAfter))),
        logoText: String(c.logoText ?? d.logoText),
        institution: String(c.institution ?? d.institution),
        title: String(c.title ?? d.title),
        datosWidths: arr(c.datosWidths, d.datosWidths),
        materiasWidths: arr(c.materiasWidths, d.materiasWidths),
        impartidasWidths: arr(c.impartidasWidths, d.impartidasWidths),
    }
}

export function buildSolicitudDocx(rawConfig: TemplateConfig): ArrayBuffer {
    const cfg = normalize(rawConfig)
    const { run, para, cell, tcell, row, table } = createOoxml(cfg.fontFamily)

    const body = Math.round(cfg.bodyPt * 2)     // half-points
    const title = Math.round(cfg.titlePt * 2)
    const small = Math.max(10, body - 2)
    const P = { before: cfg.spBefore, after: cfg.spAfter }
    const P0 = { before: cfg.spBefore, after: 0 }
    const tOpt = { cellMargin: cfg.cellMargin }
    const SPACER = para([run('', { sz: 8 })])
    const totalW = cfg.materiasWidths.reduce((a, b) => a + b, 0)

    /* 1. Encabezado institucional */
    const gh = [1500, totalW - 1500 - 2526, 2526]
    const headerTable = table(gh, [
        row([
            tcell(cfg.logoText, { align: 'center', run: { b: true, sz: title, color: '1F4E79' } }, { w: gh[0] }),
            cell(
                para([run(cfg.institution, { b: true, sz: title })], { align: 'center', ...P0 }) +
                para([run(cfg.title, { b: true, sz: body + 2 })], { align: 'center', before: 0, after: cfg.spAfter }),
                { w: gh[1] },
            ),
            cell(
                ['No. REV.', 'FECHA', 'CLAVE', 'HOJA'].map((t) =>
                    para([run(t, { sz: Math.max(10, small - 2) })], { align: 'center', before: 0, after: 0 })).join('') +
                para([run('1 DE 1', { sz: Math.max(10, small - 2), b: true })], { align: 'center', before: 0, after: 0 }),
                { w: gh[2] },
            ),
        ]),
    ], tOpt)

    /* 2. Datos */
    const g4 = cfg.datosWidths
    const L = { b: true, sz: body }
    const V = { sz: body }
    const kv = (label: string, valTag: string) => [
        tcell(label, { run: L, ...P0 }, { w: g4[0], shade: LBL }),
        tcell(valTag, { run: V, ...P0 }, { w: g4[1] }),
    ]
    const datosTable = table(g4, [
        row([
            tcell('DIRECCIÓN ACADÉMICA', { align: 'center', run: { b: true, sz: body + 2 }, ...P0 }, { w: g4[0] + g4[1], span: 2, shade: HDR }),
            tcell('PERIODO ESCOLAR:', { run: L, ...P0 }, { w: g4[2], shade: LBL }),
            tcell('{periodo}', { run: V, ...P0 }, { w: g4[3] }),
        ]),
        row([...kv('Nombre del catedrático:', '{docente}'), ...kv('Núm. de Docente:', '{num_docente}')]),
        row([...kv('Años de servicio en el ITSTB:', '{anios_servicio}'), ...kv('Tipo de Curso:', '{modalidad}')]),
        row([...kv('Licenciatura en:', '{licenciatura}'), ...kv('Ubicación:', '{ubicacion}')]),
        row([...kv('Maestría en:', '{maestria}'),
            tcell('Titulado:', { run: L, ...P0 }, { w: g4[2], shade: LBL }),
            tcell('SÍ (   )    NO (   )', { run: V, ...P0 }, { w: g4[3] })]),
        row([...kv('Doctorado en:', '{doctorado}'),
            tcell('Titulado:', { run: L, ...P0 }, { w: g4[2], shade: LBL }),
            tcell('SÍ (   )    NO (   )', { run: V, ...P0 }, { w: g4[3] })]),
    ], tOpt)

    /* 3. Instrucciones + Tabla 1 */
    const instr1 = para([run('Instrucciones: ', { b: true, sz: body }), run('Enliste las materias en orden, según su prioridad para impartirlas.', { sz: body })], P)
    const g1 = cfg.materiasWidths
    const t1head = ['No', 'Clave', 'Nombre de la Asignatura', 'Carrera', 'HP', 'HT', 'HTo', 'Cr', 'Grupos']
    const t1HeaderRow = row(t1head.map((h, i) => tcell(h, { align: 'center', run: { b: true, sz: body }, ...P0 }, { w: g1[i], shade: HDR })))
    const t1LoopRow = row([
        cell(para([run('{#materias}', { sz: body }), run('{no}', { sz: body })], { align: 'center', ...P0 }), { w: g1[0] }),
        tcell('{clave}', { align: 'center', run: { sz: body }, ...P0 }, { w: g1[1] }),
        tcell('{materia}', { run: { sz: body }, ...P0 }, { w: g1[2] }),
        tcell('{carrera}', { align: 'center', run: { sz: body }, ...P0 }, { w: g1[3] }),
        tcell('{hp}', { align: 'center', run: { sz: body }, ...P0 }, { w: g1[4] }),
        tcell('{ht}', { align: 'center', run: { sz: body }, ...P0 }, { w: g1[5] }),
        tcell('{hto}', { align: 'center', run: { sz: body }, ...P0 }, { w: g1[6] }),
        tcell('{cr}', { align: 'center', run: { sz: body }, ...P0 }, { w: g1[7] }),
        cell(para([run('{grupos}', { sz: body }), run('{/materias}', { sz: body })], { align: 'center', ...P0 }), { w: g1[8] }),
    ])
    const blankRow = () => row(g1.map((w) => tcell(' ', { ...P0 }, { w })))
    const table1 = table(g1, [t1HeaderRow, t1LoopRow, ...Array.from({ length: cfg.blankRows }, blankRow)], tOpt)

    /* 4. Instrucciones + Tabla 2 */
    const instr2 = para([run('Instrucciones: ', { b: true, sz: body }), run('Enliste aquí las asignaturas que ha impartido (últimos dos años) sin importar el periodo.', { sz: body })], P)
    const g2 = cfg.impartidasWidths
    const t2head = ['Clave', 'Nombre de la Asignatura', 'Carrera', 'Periodo']
    const t2HeaderRow = row(t2head.map((h, i) => tcell(h, { align: 'center', run: { b: true, sz: body }, ...P0 }, { w: g2[i], shade: HDR })))
    const t2LoopRow = row([
        cell(para([run('{#impartidas}', { sz: body }), run('{clave}', { sz: body })], { align: 'center', ...P0 }), { w: g2[0] }),
        tcell('{materia}', { run: { sz: body }, ...P0 }, { w: g2[1] }),
        tcell('{carrera}', { align: 'center', run: { sz: body }, ...P0 }, { w: g2[2] }),
        cell(para([run('{periodo}', { sz: body }), run('{/impartidas}', { sz: body })], { align: 'center', ...P0 }), { w: g2[3] }),
    ])
    const table2 = table(g2, [t2HeaderRow, t2LoopRow], tOpt)

    /* 5. Firmas (sin bordes) */
    const half = Math.round(totalW / 2)
    const sig = (label: string) =>
        cell(para([run('', { sz: body })], { before: 400 }) +
            para([run('_______________________________', { sz: body })], { align: 'center', after: 0 }) +
            para([run(label, { b: true, sz: body })], { align: 'center' }), { w: half })
    const firmas = table([half, totalW - half], [row([sig('Firma del Catedrático'), sig('Firma y sello de la Dirección Académica')])], { ...tOpt, borders: false })

    const bodyXml =
        headerTable + SPACER +
        datosTable + SPACER +
        instr1 + table1 + SPACER +
        instr2 + table2 + SPACER + SPACER +
        firmas

    return packDocx(bodyXml, letterSectPr())
}

export const solicitudBuilder: TemplateBuilder = {
    code: 'RPT.SOLICITUD_MATERIA',
    title: 'Solicitud de asignatura a impartir',
    defaultConfig: defaultSolicitudConfig as unknown as TemplateConfig,
    sampleData: solicitudSampleData,
    controls: solicitudControls,
    build: buildSolicitudDocx,
}
