/**
 * Genera el libro Excel oficial TecNM "Instrumentación didáctica para la
 * formación y desarrollo de competencias" (TecNM/D-AC-PO-003-07) a partir del
 * estado del editor (InstrumentacionForm), replicando la estructura de hojas
 * del formato real: 1CarAsign, 2IntDic, 3Comp, FU{n}/AU{n} por unidad,
 * 5FtesInf y 6CalEva.
 *
 * Módulo agnóstico del navegador (sin imports de Vite) para poder probarse en
 * Node; el wrapper de descarga con logo vive en downloadInstrumentacion.ts.
 */
import ExcelJS from 'exceljs'

/* ─────────────────────────── Tipos ─────────────────────────── */

export interface InstrumentacionExportContext {
    teacherName?: string | null
    periodName?: string | null
    planName?: string | null
    subjectName?: string | null
    subjectCode?: string | null
    groupName?: string | null
}

export interface InstrumentacionExportUnit {
    number: number
    title: string
    competenciaDescripcion?: string | null
    temasSubtemas?: string | null
    competenciasGenericas?: string | null
    hoursT?: number | null
    hoursP?: number | null
    startDate?: string | null
    endDate?: string | null
    learningActivities: { description: string }[]
    teachingActivities: { description: string }[]
    indicadores: { letter: string; description: string; value: number | null }[]
    nivelesDesempeno: { level: string; description: string; range: string }[]
}

export interface InstrumentacionExportEvidence {
    evidence: string
    weight: number
    unitNumber: number | null
    instrumentLabel?: string | null
    indicators: string[]
}

export interface InstrumentacionExportData {
    context: InstrumentacionExportContext
    header: {
        caracterizacion?: string | null
        intencion_didactica?: string | null
        competencias_previas?: string | null
        competencias_genericas?: string | null
        competencia_especifica_override?: string | null
        satca?: { t: number | null; p: number | null; c: number | null } | null
        fuentes: { reference: string }[]
        apoyos_didacticos: string[]
        calendar: { week: number | null; unitNumber: number | string | null; from?: string | null; to?: string | null; tp?: string | null; tr?: string | null; sd?: string | null; _secondChance?: boolean }[]
        elaborated_at?: string | null
    }
    units: InstrumentacionExportUnit[]
    evaluationItems: InstrumentacionExportEvidence[]
}

export interface InstrumentacionExportAssets {
    tecnmLogo?: { data: ArrayBuffer; extension: 'png' | 'jpeg' }
}

/* ─────────────────────── Constantes de estilo ─────────────────────── */

const FONT = 'Arial'
const CODIGO = 'Código: TecNM/D-AC-PO-003-07'
const REVISION = 'Revisión: 0'
const NORMA = 'Referencia a la Norma ISO 9001:2008 7.1, 7.2.1, 7.5.1'
const TITULO = 'INSTRUMENTACIÓN DIDÁCTICA PARA LA FORMACIÓN Y DESARROLLO DE COMPETENCIAS'

// Cuadrícula base: columnas A..V (A angosta de margen + 21 de contenido, B..V).
const LAST_COL = 22 // 'V'
const COL_W = 5.2

type Align = Partial<ExcelJS.Alignment>
interface CellStyle { bold?: boolean; size?: number; align?: Align; wrap?: boolean; underline?: boolean }

function colLetter(n: number): string {
    let s = ''
    while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) }
    return s
}

/* ─────────────────────── Builder por hoja ─────────────────────── */

class SheetBuilder {
    private merges: string[] = []
    constructor(public ws: ExcelJS.Worksheet) {}

    /** Estilo + valor en una celda simple (sin merge ni bordes). */
    set(addr: string, value: ExcelJS.CellValue, st: CellStyle = {}): void {
        const c = this.ws.getCell(addr)
        c.value = value
        c.font = { name: FONT, size: st.size ?? 9, bold: st.bold, underline: st.underline }
        c.alignment = { vertical: 'middle', wrapText: st.wrap, ...(st.align ?? {}) }
    }

    /**
     * Región con borde exterior + merge + valor. Los bordes se aplican celda
     * por celda ANTES del merge (gotcha de exceljs: tras merge las esclavas
     * comparten el style object de la master).
     */
    box(range: string, value: ExcelJS.CellValue = '', st: CellStyle & { fill?: string; rotate?: number } = {}): void {
        const [a, b] = range.split(':')
        const first = this.ws.getCell(a)
        const last = this.ws.getCell(b ?? a)
        const r1 = Number(first.row), c1 = Number(first.col)
        const r2 = Number(last.row), c2 = Number(last.col)

        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                const cell = this.ws.getCell(r, c)
                const border: Partial<ExcelJS.Borders> = {}
                if (r === r1) border.top = { style: 'thin' }
                if (r === r2) border.bottom = { style: 'thin' }
                if (c === c1) border.left = { style: 'thin' }
                if (c === c2) border.right = { style: 'thin' }
                cell.border = border
                if (st.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: st.fill } }
            }
        }

        const master = this.ws.getCell(r1, c1)
        master.value = value
        master.font = { name: FONT, size: st.size ?? 9, bold: st.bold, underline: st.underline }
        master.alignment = {
            vertical: 'middle', horizontal: 'center', wrapText: st.wrap ?? true,
            textRotation: st.rotate, ...(st.align ?? {}),
        }
        if (r2 > r1 || c2 > c1) this.merges.push(range)
    }

    /** Merge sin bordes (títulos sueltos). */
    text(range: string, value: ExcelJS.CellValue, st: CellStyle = {}): void {
        const [a, b] = range.split(':')
        const master = this.ws.getCell(a)
        master.value = value
        master.font = { name: FONT, size: st.size ?? 9, bold: st.bold, underline: st.underline }
        master.alignment = { vertical: 'middle', wrapText: st.wrap, horizontal: 'left', ...(st.align ?? {}) }
        if (b && b !== a) this.merges.push(range)
    }

    finish(): void {
        for (const m of this.merges) this.ws.mergeCells(m)
    }
}

/* ─────────────────────── Helpers de contenido ─────────────────────── */

function fmtDate(iso: string | null | undefined): string {
    if (!iso) return ''
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso)
}

function bullets(items: { description: string }[]): string {
    return items.map((a) => `• ${a.description}`).join('\n')
}

/** Altura estimada (pt) para que un texto envuelto quepa en una región. */
function fitRows(ws: ExcelJS.Worksheet, r1: number, r2: number, text: string, widthChars: number): void {
    const lines = String(text ?? '').split(/\r?\n/)
        .reduce((acc, l) => acc + Math.max(1, Math.ceil(l.length / Math.max(10, widthChars))), 0)
    const totalPt = Math.max((r2 - r1 + 1) * 13, lines * 12 + 8)
    const perRow = totalPt / (r2 - r1 + 1)
    for (let r = r1; r <= r2; r++) ws.getRow(r).height = perRow
}

interface SheetCtx {
    wb: ExcelJS.Workbook
    logoId: number | null
    page: number
    totalPages: number
}

/** Hoja nueva con cuadrícula, page setup y encabezado oficial (filas 2-4). */
function newSheet(ctx: SheetCtx, name: string, cols = LAST_COL, colW = COL_W): SheetBuilder {
    const ws = ctx.wb.addWorksheet(name, {
        pageSetup: {
            orientation: 'landscape',
            // paperSize omitido = carta (Letter) en exceljs
            fitToPage: true, fitToWidth: 1, fitToHeight: 1,
            margins: { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
        },
        properties: { defaultRowHeight: 13 },
    })
    ws.getColumn(1).width = 1.5
    for (let c = 2; c <= cols; c++) ws.getColumn(c).width = colW

    const b = new SheetBuilder(ws)
    const L = (n: number) => colLetter(n)
    // Distribución proporcional del encabezado a `cols` columnas.
    const logoEnd = 1 + Math.max(2, Math.round((cols - 1) * 0.14))          // B..D en 22 cols
    const titleEnd = 1 + Math.round((cols - 1) * 0.76)                      // E..Q
    const pagCol = titleEnd + 1

    b.box(`B2:${L(logoEnd)}4`)
    b.box(`${L(logoEnd + 1)}2:${L(titleEnd)}3`, TITULO, { bold: true, size: 11 })
    b.box(`${L(pagCol)}2:${L(cols)}2`, CODIGO, { size: 8, align: { horizontal: 'left' } })
    b.box(`${L(pagCol)}3:${L(cols)}3`, REVISION, { size: 8, align: { horizontal: 'left' } })
    b.box(`${L(logoEnd + 1)}4:${L(titleEnd)}4`, NORMA, { size: 8 })
    b.box(`${L(pagCol)}4:${L(cols)}4`, `Página  ${ctx.page}  de  ${ctx.totalPages}`, { size: 8, bold: true })
    ws.getRow(2).height = 18
    ws.getRow(3).height = 18
    ws.getRow(4).height = 14

    if (ctx.logoId !== null) {
        ws.addImage(ctx.logoId, {
            tl: { col: 1.2, row: 1.2 },
            ext: { width: 150, height: 44 },
        })
    }
    ctx.page++
    return b
}

/* ─────────────────────────── Hojas ─────────────────────────── */

function sheetCarAsign(ctx: SheetCtx, d: InstrumentacionExportData): void {
    const b = newSheet(ctx, '1CarAsign')
    const satca = d.header.satca
    const satcaText = satca ? `${satca.t ?? '?'}-${satca.p ?? '?'}-${satca.c ?? '?'}` : ''

    b.text('B6:V6', 'Instrumentación didáctica para la formación y desarrollo de competencias', { bold: true, size: 12, align: { horizontal: 'center' } })
    b.text('B7:V7', `Periodo Escolar ${d.context.periodName ?? ''}`, { bold: true, size: 11, align: { horizontal: 'center' } })
    b.text('E8:I8', 'Nombre de la asignatura:')
    b.text('J8:T8', d.context.subjectName ?? '', { bold: true })
    b.text('E9:I9', 'Plan de Estudios:')
    b.text('J9:V9', d.context.planName ?? '', { bold: true })
    b.text('E10:I10', 'Clave de la asignatura:')
    b.text('J10:T10', d.context.subjectCode ?? '', { bold: true })
    b.text('E11:L11', 'Horas teoría-Horas práctica-Créditos:')
    b.text('M11:T11', satcaText, { bold: true })

    b.text('B13:I13', '1. Caracterización de la asignatura', { bold: true, size: 10 })
    b.box('B14:V27', d.header.caracterizacion ?? '', { align: { horizontal: 'left', vertical: 'top' } })
    fitRows(b.ws, 14, 27, d.header.caracterizacion ?? '', 21 * COL_W)
    b.finish()
}

function sheetIntDic(ctx: SheetCtx, d: InstrumentacionExportData): void {
    const b = newSheet(ctx, '2IntDic')
    b.text('B6:I6', '2. Intención didáctica', { bold: true, size: 10 })
    b.box('B7:V25', d.header.intencion_didactica ?? '', { align: { horizontal: 'left', vertical: 'top' } })
    fitRows(b.ws, 7, 25, d.header.intencion_didactica ?? '', 21 * COL_W)
    b.finish()
}

function sheetComp(ctx: SheetCtx, d: InstrumentacionExportData): void {
    const b = newSheet(ctx, '3Comp')
    b.text('B6:I6', '3. Competencia de la asignatura.', { bold: true, size: 10 })
    b.text('C7:T7', '3.1. Competencias Previas', { bold: true, size: 10 })
    b.box('B8:V12', d.header.competencias_previas ?? '', { align: { horizontal: 'left', vertical: 'top' } })
    fitRows(b.ws, 8, 12, d.header.competencias_previas ?? '', 21 * COL_W)
    b.text('C14:T14', '3.2. Competencias genéricas', { bold: true, size: 10 })
    b.box('B15:V21', d.header.competencias_genericas ?? '', { align: { horizontal: 'left', vertical: 'top' } })
    fitRows(b.ws, 15, 21, d.header.competencias_genericas ?? '', 21 * COL_W)
    b.text('C23:T23', '3.3. Competencias específicas de la asignatura', { bold: true, size: 10 })
    b.box('B24:V29', d.header.competencia_especifica_override ?? '', { align: { horizontal: 'left', vertical: 'top' } })
    fitRows(b.ws, 24, 29, d.header.competencia_especifica_override ?? '', 21 * COL_W)
    b.finish()
}

function sheetUnidadFrente(ctx: SheetCtx, u: InstrumentacionExportUnit): void {
    const b = newSheet(ctx, `FU${u.number}`)
    const nn = String(u.number).padStart(2, '0')

    b.text('C6:Q6', '4. Análisis por competencias específicas', { bold: true, size: 10 })
    b.text('B7:C7', 'Competencia No.:', { bold: true })
    b.text('D7:D7', nn, { bold: true, align: { horizontal: 'center' } })
    b.text('E7:V7', u.title ?? '', { bold: true, underline: true })
    b.text('B8:D8', 'Descripción:', { bold: true })
    b.text('E8:V8', u.competenciaDescripcion ?? '', { wrap: true, underline: true })
    b.ws.getRow(8).height = 24

    // Cabecera de la tabla (filas 10-11) — misma proporción que el original:
    // B:D temas · E:J aprendizaje · K:P enseñanza · Q:T genéricas · U:V horas.
    b.box('B10:D11', 'Temas y subtemas para desarrollar la competencia específica', { bold: true })
    b.box('E10:J11', 'Actividades de aprendizaje', { bold: true })
    b.box('K10:P11', 'Actividades de enseñanza', { bold: true })
    b.box('Q10:T11', 'Desarrollo de competencias genéricas', { bold: true })
    b.box('U10:V11', 'Horas teórico-prácticas', { bold: true })

    const temas = u.temasSubtemas ?? ''
    const aprend = bullets(u.learningActivities)
    const ensen = bullets(u.teachingActivities)
    const gener = u.competenciasGenericas ?? ''
    b.box('B12:D26', temas, { align: { horizontal: 'left', vertical: 'top' } })
    b.box('E12:J26', aprend, { align: { horizontal: 'left', vertical: 'top' } })
    b.box('K12:P26', ensen, { align: { horizontal: 'left', vertical: 'top' } })
    b.box('Q12:T26', gener, { align: { horizontal: 'left', vertical: 'top' } })
    b.box('U12:V13', `${u.hoursT ?? 0} - ${u.hoursP ?? 0}`, { bold: true })
    b.box('U14:V26', u.startDate || u.endDate ? `Del ${fmtDate(u.startDate)} al ${fmtDate(u.endDate)}` : '')

    // Altura según la columna más cargada (aprendizaje/enseñanza son las angostas: 6 cols).
    const longest = Math.max(
        ...[temas, gener].map((t) => t.length / (3 * COL_W)),
        ...[aprend, ensen].map((t) => t.length / (6 * COL_W)),
    )
    fitRows(b.ws, 12, 26, '\n'.repeat(Math.ceil(longest)), 999)
    b.finish()
}

function sheetUnidadAtras(ctx: SheetCtx, u: InstrumentacionExportUnit, evidences: InstrumentacionExportEvidence[]): void {
    const b = newSheet(ctx, `AU${u.number}`)
    let row = 6

    /* Indicadores de alcance */
    b.box(`C${row}:S${row}`, 'Indicadores de alcance', { bold: true })
    b.box(`T${row}:V${row}`, 'Valor del indicador', { bold: true })
    row++
    for (const ind of u.indicadores) {
        b.box(`C${row}:S${row}`, `${ind.letter}) ${ind.description}`, { align: { horizontal: 'left' } })
        b.box(`T${row}:V${row}`, ind.value ?? '')
        fitRows(b.ws, row, row, `${ind.letter}) ${ind.description}`, 17 * COL_W)
        row++
    }

    /* Niveles de desempeño */
    if (u.nivelesDesempeno.length) {
        row += 1
        b.text(`B${row}:V${row}`, 'Niveles de desempeño:', { bold: true, size: 11, align: { horizontal: 'center' } })
        row += 1
        b.box(`B${row}:C${row}`, 'Desempeño', { bold: true })
        b.box(`D${row}:F${row}`, 'Nivel de desempeño', { bold: true })
        b.box(`G${row}:S${row}`, 'Indicadores de alcance', { bold: true })
        b.box(`T${row}:V${row}`, 'Valoración numérica', { bold: true })
        row++
        const alcanzados = u.nivelesDesempeno.filter((n) => n.level.toLowerCase() !== 'insuficiente')
        const noAlcanzados = u.nivelesDesempeno.filter((n) => n.level.toLowerCase() === 'insuficiente')
        if (alcanzados.length) {
            b.box(`B${row}:C${row + alcanzados.length - 1}`, 'Competencia alcanzada', { bold: true })
            for (const n of alcanzados) {
                b.box(`D${row}:F${row}`, n.level, { bold: true })
                b.box(`G${row}:S${row}`, n.description, { align: { horizontal: 'left' } })
                b.box(`T${row}:V${row}`, n.range)
                fitRows(b.ws, row, row, n.description, 13 * COL_W)
                row++
            }
        }
        if (noAlcanzados.length) {
            b.box(`B${row}:C${row + noAlcanzados.length - 1}`, 'Competencia no alcanzada', { bold: true, wrap: true })
            for (const n of noAlcanzados) {
                b.box(`D${row}:F${row}`, n.level, { bold: true })
                b.box(`G${row}:S${row}`, n.description, { align: { horizontal: 'left' } })
                b.box(`T${row}:V${row}`, n.range)
                fitRows(b.ws, row, row, n.description, 13 * COL_W)
                row++
            }
        }
    }

    /* Matriz de evaluación */
    row += 1
    b.text(`B${row}:V${row}`, 'Matriz de evaluación:', { bold: true, size: 11, align: { horizontal: 'center' } })
    row += 1
    const letters = u.indicadores.map((i) => i.letter.toUpperCase())
    const nL = Math.max(1, letters.length)
    // Columnas: B..L evidencia (11) · M % · N.. letras (1 c/u) · resto instrumento.
    const letterStart = 14 // 'N'
    const instrStart = letterStart + nL
    const L = (n: number) => colLetter(n)

    b.box(`B${row}:L${row + 1}`, 'Evidencia de aprendizaje', { bold: true })
    b.box(`M${row}:M${row + 1}`, '%', { bold: true })
    b.box(`${L(letterStart)}${row}:${L(letterStart + nL - 1)}${row}`, 'Indicador de alcance', { bold: true })
    b.box(`${L(instrStart)}${row}:V${row + 1}`, 'Evaluación formativa de la competencia', { bold: true })
    letters.forEach((l, i) => {
        const ind = u.indicadores[i]
        b.box(`${L(letterStart + i)}${row + 1}:${L(letterStart + i)}${row + 1}`, `${l}\n${ind?.value ?? ''}`, { bold: true, size: 8 })
    })
    b.ws.getRow(row + 1).height = 22
    row += 2

    for (const ev of evidences) {
        b.box(`B${row}:L${row}`, ev.evidence, { align: { horizontal: 'left' } })
        b.box(`M${row}:M${row}`, ev.weight ?? '')
        letters.forEach((l, i) => {
            b.box(`${L(letterStart + i)}${row}:${L(letterStart + i)}${row}`, ev.indicators.some((x) => x.toUpperCase() === l) ? 'x' : '')
        })
        b.box(`${L(instrStart)}${row}:V${row}`, ev.instrumentLabel ?? '', { align: { horizontal: 'left' } })
        row++
    }
    const total = evidences.reduce((acc, e) => acc + (Number(e.weight) || 0), 0)
    b.box(`B${row}:L${row}`, '100 % de evidencia', { bold: true, align: { horizontal: 'right' } })
    b.box(`M${row}:M${row}`, total, { bold: true })
    b.box(`${L(letterStart)}${row}:V${row}`, '')
    b.finish()
}

function sheetFuentes(ctx: SheetCtx, d: InstrumentacionExportData): void {
    const b = newSheet(ctx, '5FtesInf')
    b.text('B6:V6', '5. Fuentes de información y apoyos didácticos', { bold: true, size: 10 })
    b.box('B8:R8', 'Fuentes de información:', { bold: true })
    b.box('S8:V8', 'Apoyos didácticos:', { bold: true })

    const refs = d.header.fuentes ?? []
    const apoyos = d.header.apoyos_didacticos ?? []
    const rows = Math.max(refs.length, apoyos.length, 12)
    const fromRow = 9
    b.box(`B${fromRow}:R${fromRow + rows - 1}`, refs.map((f, i) => `${i + 1}. ${f.reference}`).join('\n'), { align: { horizontal: 'left', vertical: 'top' } })
    b.box(`S${fromRow}:V${fromRow + rows - 1}`, apoyos.join('\n\n'), { align: { vertical: 'top' } })
    fitRows(b.ws, fromRow, fromRow + rows - 1, refs.map((f, i) => `${i + 1}. ${f.reference}`).join('\n'), 17 * COL_W)
    b.finish()
}

function sheetCalEva(ctx: SheetCtx, d: InstrumentacionExportData): void {
    const weeks = d.header.calendar ?? []
    const cols = Math.max(LAST_COL, 2 + weeks.length)
    const b = newSheet(ctx, '6CalEva', cols, Math.max(4.5, Math.min(COL_W, 110 / Math.max(1, cols))))
    const L = (n: number) => colLetter(n)

    let row = 8
    b.text(`B${row}:${L(Math.min(cols, 12))}${row}`, 'Calendarización de evaluación (semanas):', { bold: true, size: 10 })
    row++

    if (weeks.length) {
        const firstWeekCol = 3 // 'C'
        b.box(`B${row}:B${row}`, 'Semanas', { bold: true })
        weeks.forEach((w, i) => b.box(`${L(firstWeekCol + i)}${row}:${L(firstWeekCol + i)}${row}`, w.week ?? '', { bold: true }))
        row++
        b.box(`B${row}:B${row}`, 'Unidad', { bold: true })
        weeks.forEach((w, i) => b.box(`${L(firstWeekCol + i)}${row}:${L(firstWeekCol + i)}${row}`, w.unitNumber ?? ''))
        row++
        // Fila de fechas con texto vertical, como el formato real.
        b.box(`B${row}:B${row}`, '')
        weeks.forEach((w, i) => b.box(
            `${L(firstWeekCol + i)}${row}:${L(firstWeekCol + i)}${row}`,
            w.from || w.to
                ? `Del ${fmtDate(w.from)} al ${fmtDate(w.to)}${w._secondChance ? ' segunda oportunidad' : ''}`
                : '',
            { size: 7, rotate: 90 },
        ))
        b.ws.getRow(row).height = 86
        row++
        for (const [label, key] of [['T.P.', 'tp'], ['T.R.', 'tr'], ['S.D', 'sd']] as const) {
            b.box(`B${row}:B${row}`, label, { bold: true })
            weeks.forEach((w, i) => b.box(`${L(firstWeekCol + i)}${row}:${L(firstWeekCol + i)}${row}`, w[key] ?? ''))
            row++
        }
    } else {
        b.text(`B${row}:${L(cols)}${row}`, '(Sin semanas capturadas)')
        row++
    }

    row += 2
    b.text(`B${row}:${L(cols)}${row}`, 'ED = Evaluación diagnóstica. EFn = Evaluación formativa. ES = Evaluación sumativa. TP = Tiempo planeado. TR = Tiempo real.', { size: 8 })
    row++
    b.text(`B${row}:${L(cols)}${row}`, '☆ Evaluación 2da oportunidad          SD = Seguimiento Departamental', { size: 8 })
    row += 2
    b.text(`${L(Math.max(2, cols - 8))}${row}:${L(cols - 4)}${row}`, 'Fecha de elaboración:', { bold: true, align: { horizontal: 'right' } })
    b.text(`${L(cols - 3)}${row}:${L(cols)}${row}`, fmtDate(d.header.elaborated_at), { align: { horizontal: 'center' } })
    row += 4

    // Firmas: nombre sobre línea (borde inferior) y cargo debajo.
    const half = Math.floor(cols / 2)
    const sigW = 8
    const leftStart = 3
    const rightStart = half + 2
    const setSig = (startCol: number, name: string, role: string) => {
        const nameRange = `${L(startCol)}${row}:${L(startCol + sigW)}${row}`
        b.text(nameRange, name, { bold: true, align: { horizontal: 'center' } })
        for (let c = startCol; c <= startCol + sigW; c++) {
            b.ws.getCell(row, c).border = { bottom: { style: 'thin' } }
        }
        b.text(`${L(startCol)}${row + 1}:${L(startCol + sigW)}${row + 1}`, role, { align: { horizontal: 'center' } })
    }
    setSig(leftStart, d.context.teacherName ?? '', 'Docente')
    setSig(rightStart, '', 'Vo. Bo. Jefe(a) del Departamento')
    b.finish()
}

/* ─────────────────────────── Libro ─────────────────────────── */

export async function buildInstrumentacionXlsx(
    data: InstrumentacionExportData,
    assets: InstrumentacionExportAssets = {},
): Promise<ExcelJS.Workbook> {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'SGI v3'

    const logoId = assets.tecnmLogo
        ? wb.addImage({ buffer: assets.tecnmLogo.data as never, extension: assets.tecnmLogo.extension })
        : null

    const units = [...(data.units ?? [])].sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
    // Paginación como el formato real: portada 1 … unidades, fuentes, calendario al final.
    const ctx: SheetCtx = { wb, logoId, page: 1, totalPages: 3 + units.length * 2 + 2 }

    sheetCarAsign(ctx, data)
    sheetIntDic(ctx, data)
    sheetComp(ctx, data)
    for (const u of units) {
        sheetUnidadFrente(ctx, u)
        sheetUnidadAtras(ctx, u, (data.evaluationItems ?? []).filter((e) => e.unitNumber === u.number))
    }
    sheetFuentes(ctx, data)
    sheetCalEva(ctx, data)

    return wb
}

/** Empaqueta el libro como Blob listo para descargar. */
export async function packInstrumentacionXlsx(
    data: InstrumentacionExportData,
    assets: InstrumentacionExportAssets = {},
): Promise<Blob> {
    const wb = await buildInstrumentacionXlsx(data, assets)
    const buf = await wb.xlsx.writeBuffer()
    return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
