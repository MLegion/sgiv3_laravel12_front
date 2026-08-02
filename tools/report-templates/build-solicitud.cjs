/* Build the official SOLICITUD DE ASIGNATURA .docx template (report 13).
   OOXML by hand + pizzip. Fill engine = docxtemplater (delimiters { }, paragraphLoop). */
const fs = require('fs')
const PizZip = require('pizzip')

/* ---------- helpers ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// a run of text; opts: {b bold, sz half-points, color, i italic}
function run(text, opts = {}) {
    const o = opts
    const rpr =
        `<w:rPr>` +
        (o.b ? `<w:b/>` : ``) +
        (o.i ? `<w:i/>` : ``) +
        `<w:sz w:val="${o.sz || 18}"/><w:szCs w:val="${o.sz || 18}"/>` +
        (o.color ? `<w:color w:val="${o.color}"/>` : ``) +
        `<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>` +
        `</w:rPr>`
    return `<w:r>${rpr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`
}

// a paragraph; opts: {align, runs:[...], spacing}
function para(runs, opts = {}) {
    const o = opts
    const ppr =
        `<w:pPr>` +
        (o.align ? `<w:jc w:val="${o.align}"/>` : ``) +
        `<w:spacing w:before="${o.before ?? 10}" w:after="${o.after ?? 10}" w:line="240" w:lineRule="auto"/>` +
        `</w:pPr>`
    return `<w:p>${ppr}${Array.isArray(runs) ? runs.join('') : runs}</w:p>`
}

// a table cell; opts: {w twips, span, shade hex, align, valign}
function cell(bodyXml, opts = {}) {
    const o = opts
    const tcpr =
        `<w:tcPr>` +
        (o.w ? `<w:tcW w:w="${o.w}" w:type="dxa"/>` : `<w:tcW w:w="0" w:type="auto"/>`) +
        (o.span ? `<w:gridSpan w:val="${o.span}"/>` : ``) +
        (o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : ``) +
        `<w:vAlign w:val="${o.valign || 'center'}"/>` +
        `</w:tcPr>`
    return `<w:tc>${tcpr}${bodyXml}</w:tc>`
}

// text cell shorthand
function tcell(text, popts = {}, copts = {}) {
    return cell(para([run(text, popts.run || {})], popts), copts)
}

const row = (cells) => `<w:tr>${cells.join('')}</w:tr>`

// full-width table with single-line borders; grid = array of col widths
function table(grid, rows) {
    const borders =
        `<w:tblBorders>` +
        ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
            .map((s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join('') +
        `</w:tblBorders>`
    const tblGrid = `<w:tblGrid>${grid.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>`
    return (
        `<w:tbl><w:tblPr>` +
        `<w:tblW w:w="9026" w:type="dxa"/>` +
        `<w:tblLayout w:type="fixed"/>` +
        borders +
        `<w:tblCellMar><w:left w:w="60" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tblCellMar>` +
        `</w:tblPr>${tblGrid}${rows.join('')}</w:tbl>`
    )
}

const HDR = 'DCE6F1' // header shade
const SPACER = para([run('', { sz: 8 })])

/* ---------- 1. Institutional header ---------- */
const headerTable = table([1500, 5000, 2526], [
    row([
        tcell('ITSTB', { align: 'center', run: { b: true, sz: 20, color: '1F4E79' } }, { w: 1500 }),
        cell(
            para([run('INSTITUTO TECNOLÓGICO SUPERIOR DE TIERRA BLANCA', { b: true, sz: 20 })], { align: 'center' }) +
            para([run('SOLICITUD DE ASIGNATURA A IMPARTIR ({modalidad})', { b: true, sz: 18 })], { align: 'center' }),
            { w: 5000 },
        ),
        cell(
            para([run('No. REV.', { sz: 14 })], { align: 'center', after: 0 }) +
            para([run('FECHA', { sz: 14 })], { align: 'center', before: 0, after: 0 }) +
            para([run('CLAVE', { sz: 14 })], { align: 'center', before: 0, after: 0 }) +
            para([run('HOJA', { sz: 14 })], { align: 'center', before: 0, after: 0 }) +
            para([run('1 DE 1', { sz: 14, b: true })], { align: 'center', before: 0 }),
            { w: 2526 },
        ),
    ]),
])

/* ---------- 2. Datos grid ---------- */
const L = { b: true, sz: 16 } // label style
const V = { sz: 16 }          // value style
const g4 = [2400, 2113, 2400, 2113]
const kv = (label, valTag, lopts = L) => [
    tcell(label, { run: lopts, after: 0 }, { w: g4[0], shade: 'F2F2F2' }),
    tcell(valTag, { run: V, after: 0 }, { w: g4[1] }),
]
const datosTable = table(g4, [
    row([
        tcell('DIRECCIÓN ACADÉMICA', { align: 'center', run: { b: true, sz: 18 } }, { w: g4[0] + g4[1], span: 2, shade: HDR }),
        tcell('PERIODO ESCOLAR:', { run: L, after: 0 }, { w: g4[2], shade: 'F2F2F2' }),
        tcell('{periodo}', { run: V, after: 0 }, { w: g4[3] }),
    ]),
    row([...kv('Nombre del catedrático:', '{docente}'), ...kv('Núm. de Docente:', '{num_docente}')]),
    row([...kv('Años de servicio en el ITSTB:', '{anios_servicio}'), ...kv('Tipo de Curso:', '{modalidad}')]),
    row([...kv('Licenciatura en:', '{licenciatura}'), ...kv('Ubicación:', '{ubicacion}')]),
    row([...kv('Maestría en:', '{maestria}'),
        tcell('Titulado:', { run: L, after: 0 }, { w: g4[2], shade: 'F2F2F2' }),
        tcell('SÍ (   )    NO (   )', { run: V, after: 0 }, { w: g4[3] })]),
    row([...kv('Doctorado en:', '{doctorado}'),
        tcell('Titulado:', { run: L, after: 0 }, { w: g4[2], shade: 'F2F2F2' }),
        tcell('SÍ (   )    NO (   )', { run: V, after: 0 }, { w: g4[3] })]),
])

/* ---------- 3. Instrucciones + Tabla 1 (materias solicitadas) ---------- */
const instr1 = para([
    run('Instrucciones: ', { b: true, sz: 16 }),
    run('Enliste las materias en orden, según su prioridad para impartirlas.', { sz: 16 }),
])

const g1 = [500, 1050, 2650, 1150, 500, 500, 550, 500, 1126]
const t1head = ['No', 'Clave', 'Nombre de la Asignatura', 'Carrera', 'HP', 'HT', 'HTo', 'Cr', 'Grupos']
const t1HeaderRow = row(t1head.map((h, i) =>
    tcell(h, { align: 'center', run: { b: true, sz: 16 }, after: 0 }, { w: g1[i], shade: HDR })))

// looped data row: {#materias} opens in first cell, {/materias} closes in last
const t1LoopRow = row([
    cell(para([run('{#materias}', { sz: 16 }), run('{no}', { sz: 16 })], { align: 'center', after: 0 }), { w: g1[0] }),
    tcell('{clave}', { align: 'center', run: { sz: 16 }, after: 0 }, { w: g1[1] }),
    tcell('{materia}', { run: { sz: 16 }, after: 0 }, { w: g1[2] }),
    tcell('{carrera}', { align: 'center', run: { sz: 16 }, after: 0 }, { w: g1[3] }),
    tcell('{hp}', { align: 'center', run: { sz: 16 }, after: 0 }, { w: g1[4] }),
    tcell('{ht}', { align: 'center', run: { sz: 16 }, after: 0 }, { w: g1[5] }),
    tcell('{hto}', { align: 'center', run: { sz: 16 }, after: 0 }, { w: g1[6] }),
    tcell('{cr}', { align: 'center', run: { sz: 16 }, after: 0 }, { w: g1[7] }),
    cell(para([run('{grupos}', { sz: 16 }), run('{/materias}', { sz: 16 })], { align: 'center', after: 0 }), { w: g1[8] }),
])
// blank rows for handwriting
// Sin filas en blanco estáticas: el post_script pad_rows del DAO rellena hasta el mínimo.
const table1 = table(g1, [t1HeaderRow, t1LoopRow])

/* ---------- 4. Instrucciones + Tabla 2 (impartidas) ---------- */
const instr2 = para([
    run('Instrucciones: ', { b: true, sz: 16 }),
    run('Enliste aquí las asignaturas que ha impartido (últimos dos años) sin importar el periodo.', { sz: 16 }),
])

const g2 = [1500, 3500, 1800, 2226]
const t2head = ['Clave', 'Nombre de la Asignatura', 'Carrera', 'Periodo']
const t2HeaderRow = row(t2head.map((h, i) =>
    tcell(h, { align: 'center', run: { b: true, sz: 16 }, after: 0 }, { w: g2[i], shade: HDR })))
const t2LoopRow = row([
    cell(para([run('{#impartidas}', { sz: 16 }), run('{clave}', { sz: 16 })], { align: 'center', after: 0 }), { w: g2[0] }),
    tcell('{materia}', { run: { sz: 16 }, after: 0 }, { w: g2[1] }),
    tcell('{carrera}', { align: 'center', run: { sz: 16 }, after: 0 }, { w: g2[2] }),
    cell(para([run('{periodo}', { sz: 16 }), run('{/impartidas}', { sz: 16 })], { align: 'center', after: 0 }), { w: g2[3] }),
])
const table2 = table(g2, [t2HeaderRow, t2LoopRow])

/* ---------- 5. Firmas ---------- */
const firmas = table([4513, 4513], [
    row([
        cell(para([run('', { sz: 16 })], { before: 400 }) + para([run('_______________________________', { sz: 16 })], { align: 'center', after: 0 }) + para([run('Firma del Catedrático', { b: true, sz: 16 })], { align: 'center' }), { w: 4513 }),
        cell(para([run('', { sz: 16 })], { before: 400 }) + para([run('_______________________________', { sz: 16 })], { align: 'center', after: 0 }) + para([run('Firma y sello de la Dirección Académica', { b: true, sz: 16 })], { align: 'center' }), { w: 4513 }),
    ]),
])
// firmas table without visible borders
const firmasNoBorder = firmas.replace(
    /<w:tblBorders>.*?<\/w:tblBorders>/s,
    `<w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((s) => `<w:${s} w:val="none" w:sz="0" w:space="0" w:color="auto"/>`).join('')}</w:tblBorders>`,
)

/* ---------- document.xml ---------- */
const body =
    headerTable + SPACER +
    datosTable + SPACER +
    instr1 + table1 + SPACER +
    instr2 + table2 + SPACER + SPACER +
    firmasNoBorder

const documentXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<w:body>${body}` +
    `<w:sectPr>` +
    `<w:pgSz w:w="12240" w:h="15840"/>` +
    `<w:pgMar w:top="720" w:right="1080" w:bottom="720" w:left="1080" w:header="360" w:footer="360" w:gutter="0"/>` +
    `</w:sectPr>` +
    `</w:body></w:document>`

/* ---------- package (.docx) ---------- */
const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `</Types>`
const rels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
    `</Relationships>`

const zip = new PizZip()
zip.file('[Content_Types].xml', contentTypes)
zip.file('_rels/.rels', rels)
zip.file('word/document.xml', documentXml)
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
const out = process.argv[2] || '/tmp/13.docx'
fs.writeFileSync(out, buf)
console.log('wrote', out, buf.length, 'bytes')
