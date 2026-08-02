/* Build the CARGA DE MATERIAS (RPT.CARGA_DOCENTE) .docx template.
   Encabezado (logo + modalidad/campus/periodo) + tabla agrupada por docente con
   subtotales. Loop anidado {#docentes}{#materias}…{/materias}…{/docentes}.
   Uso: node build-carga.cjs <out.docx> <logo.png>  */
const fs = require('fs')
const PizZip = require('pizzip')

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function run(text, o = {}) {
    const rpr = `<w:rPr>` + (o.b ? `<w:b/>` : ``) + (o.i ? `<w:i/>` : ``) +
        `<w:sz w:val="${o.sz || 12}"/><w:szCs w:val="${o.sz || 12}"/>` +
        (o.color ? `<w:color w:val="${o.color}"/>` : ``) +
        `<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/></w:rPr>`
    return `<w:r>${rpr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`
}
function para(runs, o = {}) {
    const ppr = `<w:pPr>` + (o.align ? `<w:jc w:val="${o.align}"/>` : ``) +
        `<w:spacing w:before="${o.before ?? 6}" w:after="${o.after ?? 6}" w:line="240" w:lineRule="auto"/></w:pPr>`
    return `<w:p>${ppr}${Array.isArray(runs) ? runs.join('') : runs}</w:p>`
}
function cellBorders(b) {
    if (!b) return ''
    const parts = ['top', 'left', 'bottom', 'right'].filter((s) => b[s])
        .map((s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`)
    return parts.length ? `<w:tcBorders>${parts.join('')}</w:tcBorders>` : ''
}
function cell(bodyXml, o = {}) {
    const tcpr = `<w:tcPr>` +
        (o.w ? `<w:tcW w:w="${o.w}" w:type="dxa"/>` : `<w:tcW w:w="0" w:type="auto"/>`) +
        (o.span ? `<w:gridSpan w:val="${o.span}"/>` : ``) +
        cellBorders(o.borders) +
        (o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : ``) +
        `<w:vAlign w:val="${o.valign || 'center'}"/></w:tcPr>`
    return `<w:tc>${tcpr}${bodyXml}</w:tc>`
}
function tcell(text, po = {}, co = {}) { return cell(para([run(text, po.run || {})], po), co) }
const row = (cells) => `<w:tr>${cells.join('')}</w:tr>`
function table(grid, rows, o = {}) {
    const single = (s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`
    const none = (s) => `<w:${s} w:val="none" w:sz="0" w:space="0" w:color="auto"/>`
    const sides = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
    const borders = o.borders === false
        ? `<w:tblBorders>${sides.map(none).join('')}</w:tblBorders>`
        : `<w:tblBorders>${sides.map(single).join('')}</w:tblBorders>`
    const w = o.width ?? grid.reduce((a, b) => a + b, 0)
    return `<w:tbl><w:tblPr><w:tblW w:w="${w}" w:type="dxa"/><w:tblLayout w:type="fixed"/>${borders}` +
        `<w:tblCellMar><w:left w:w="40" w:type="dxa"/><w:right w:w="40" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
        `<w:tblGrid>${grid.map((x) => `<w:gridCol w:w="${x}"/>`).join('')}</w:tblGrid>${rows.join('')}</w:tbl>`
}
// imagen inline (logo)
function imageRun(rId, cx, cy) {
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
        `<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
        `<wp:docPr id="1" name="logo"/>` +
        `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
        `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
        `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
        `<pic:nvPicPr><pic:cNvPr id="1" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
        `<pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
        `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
        `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic>` +
        `</wp:inline></w:drawing></w:r>`
}

const ORANGE = 'F8CBAD'
const RID_IMG = 'rId100'

/* ---------- encabezado ---------- */
const headerTable = table([1500, 4600, 4100], [
    row([
        cell(para([imageRun(RID_IMG, 925500, 800100)], { align: 'center' }), { w: 1500, borders: {} }),
        cell(para([run('INSTITUTO TECNOLÓGICO SUPERIOR DE TIERRA BLANCA', { b: true, sz: 20 })], { align: 'center' }), { w: 4600, valign: 'center' }),
        cell(
            para([run('CARGA DE MATERIAS', { b: true, sz: 26 })], { align: 'center', after: 4 }) +
            para([run('MODALIDAD: ', { b: true, sz: 18 }), run('{modalidad}', { sz: 18 })], { after: 0 }) +
            para([run('CAMPUS: ', { b: true, sz: 18 }), run('{campus}', { sz: 18 })], { before: 0, after: 0 }) +
            para([run('PERIODO: ', { b: true, sz: 18 }), run('{periodo}', { sz: 18 })], { before: 0 }),
            { w: 4100 },
        ),
    ]),
], { borders: false })

/* ---------- tabla principal ---------- */
const g = [380, 1550, 720, 1250, 400, 400, 400, 400, 400, 420, 380, 470, 650, 470, 1510]
const heads = ['No', 'ASIGNATURA', 'CLAVE', 'CARRERA', 'E.D.', 'S.D.', 'IMP.', 'SOL', 'HT.', 'Crs.', 'Sem', 'Turno', 'Grupo', 'ND', 'Docente']
const headerRow = row(heads.map((h, i) =>
    tcell(h, { align: 'center', run: { b: true, sz: 13 }, before: 4, after: 4 }, { w: g[i], shade: ORANGE })))

// fila de materia (loop interno). {#docentes} y {#materias} abren en la 1a celda;
// {/materias} cierra en la última de esta fila.
const B = 12
const c = (tag, i, al = 'center') => tcell(tag, { align: al, run: { sz: B }, before: 3, after: 3 }, { w: g[i] })
const materiaRow = row([
    cell(para([run('{#docentes}', { sz: B }), run('{#materias}', { sz: B }), run('{no}', { sz: B })], { align: 'center', before: 3, after: 3 }), { w: g[0] }),
    c('{asignatura}', 1, 'left'), c('{clave}', 2), c('{carrera}', 3, 'left'),
    c('{ed}', 4), c('{sd}', 5), c('{imp}', 6), c('{sol}', 7),
    c('{ht}', 8), c('{crs}', 9), c('{sem}', 10), c('{turno}', 11), c('{grupo}', 12), c('{nd}', 13),
    cell(para([run('{docente}', { sz: B }), run('{/materias}', { sz: B })], { align: 'left', before: 3, after: 3 }), { w: g[14] }),
])
// fila de subtotales (dentro de {#docentes}, fuera de materias). {/docentes} cierra en la última celda.
const totalsRow = row([
    tcell('TOTAL DE HORAS:', { align: 'right', run: { b: true, sz: B }, before: 3, after: 3 }, { w: g.slice(0, 8).reduce((a, b) => a + b, 0), span: 8, shade: 'F2F2F2' }),
    tcell('{total_horas}', { align: 'center', run: { b: true, sz: B }, before: 3, after: 3 }, { w: g[8], shade: 'F2F2F2' }),
    tcell('TOTAL DE GRUPOS:', { align: 'right', run: { b: true, sz: B }, before: 3, after: 3 }, { w: g.slice(9, 12).reduce((a, b) => a + b, 0), span: 3, shade: 'F2F2F2' }),
    tcell('{total_grupos}', { align: 'center', run: { b: true, sz: B }, before: 3, after: 3 }, { w: g[12], shade: 'F2F2F2' }),
    cell(para([run('{/docentes}', { sz: B })], { before: 3, after: 3 }), { w: g[13] + g[14], span: 2, shade: 'F2F2F2' }),
])
const mainTable = table(g, [headerRow, materiaRow, totalsRow])

const SPACER = para([run('', { sz: 8 })])
const body = headerTable + SPACER + mainTable

const documentXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
    `xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ` +
    `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
    `xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<w:body>${body}` +
    `<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>` +
    `<w:pgMar w:top="600" w:right="620" w:bottom="600" w:left="620" w:header="360" w:footer="360" w:gutter="0"/>` +
    `</w:sectPr></w:body></w:document>`

/* ---------- empaquetado con imagen ---------- */
const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Default Extension="png" ContentType="image/png"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `</Types>`
const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
    `</Relationships>`
const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="${RID_IMG}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>` +
    `</Relationships>`

const out = process.argv[2] || '/tmp/carga.docx'
const logoPath = process.argv[3] || '/tmp/logo.png'
const zip = new PizZip()
zip.file('[Content_Types].xml', contentTypes)
zip.file('_rels/.rels', rels)
zip.file('word/document.xml', documentXml)
zip.file('word/_rels/document.xml.rels', docRels)
zip.file('word/media/image1.png', fs.readFileSync(logoPath))
fs.writeFileSync(out, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }))
console.log('wrote', out, fs.statSync(out).size, 'bytes')
