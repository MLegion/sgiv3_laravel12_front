// Generación de documentos oficiales de movilidad (client-side, html2pdf + QR).
// Estructura alineada al formato estándar TecNM/DGAIR (Acuerdo 286):
// encabezado + tabla origen→destino + firmantes + firma electrónica (folio + QR).
import html2pdf from 'html2pdf.js'
import QRCode from 'qrcode'

type DocType = 'dictamen' | 'certificado' | 'oficio'

const esc = (s: any): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function fmtDate(iso?: string | null): string {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) } catch { return String(iso) }
}

async function qrTag(url?: string | null): Promise<string> {
    if (!url) return ''
    const dataUrl = await QRCode.toDataURL(url, { width: 120, margin: 1 })
    return `<img src="${dataUrl}" width="110" height="110" alt="QR" />`
}

function signatureBlock(sig: any, qr: string): string {
    if (!sig) {
        return `<div class="sign"><div class="line"></div><div class="role">Firma pendiente</div></div>`
    }
    return `
    <div class="signwrap">
        <div class="sign">
            <div class="line"></div>
            <div class="name">${esc(sig.signer_name)}</div>
            <div class="role">${esc(sig.signer_role || 'Servicios Escolares')}</div>
        </div>
        <div class="qr">
            ${qr}
            <div class="qrtext">Firma electrónica · Folio <b>${esc(sig.folio)}</b><br>Verifique en:<br>${esc(sig.verify_url)}</div>
        </div>
    </div>`
}

const STYLE = `
<style>
* { box-sizing: border-box; font-family: 'Times New Roman', Georgia, serif; color: #111; }
.doc { width: 190mm; padding: 6mm 4mm; font-size: 11pt; line-height: 1.45; }
.head { text-align: center; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 14px; }
.head .inst { font-size: 12pt; font-weight: bold; text-transform: uppercase; }
.head .title { font-size: 13pt; font-weight: bold; margin-top: 8px; }
.meta { display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 10px; }
.block { margin: 10px 0; }
.block b { display: inline-block; min-width: 120px; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
th { background: #eee; }
.legal { font-size: 9pt; text-align: justify; margin: 14px 0; color: #333; }
.signwrap { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
.sign { text-align: center; width: 55%; }
.sign .line { border-top: 1px solid #111; margin: 30px 20px 4px; }
.sign .name { font-weight: bold; }
.sign .role { font-size: 9pt; text-transform: uppercase; }
.qr { text-align: center; font-size: 8pt; color: #444; }
.qrtext { margin-top: 2px; max-width: 150px; }
</style>`

function header(d: any, subtitle: string): string {
    return `
    <div class="head">
        <div class="inst">${esc(d.issuing_college?.name || 'Instituto Tecnológico')}</div>
        <div class="title">${subtitle}</div>
    </div>
    <div class="meta">
        <div>Folio: <b>${esc(d.dictamen_number || d.signature?.folio || '—')}</b></div>
        <div>Fecha: <b>${fmtDate(d.resolution_date)}</b></div>
    </div>`
}

function studentBlock(d: any): string {
    return `
    <div class="block">
        <div><b>Alumno(a):</b> ${esc(d.student?.name || '—')}</div>
        <div><b>No. de control:</b> ${esc(d.student?.num_control || '—')}</div>
        <div><b>Carrera / Plan:</b> ${esc(d.plan ? `${d.plan.career ?? ''} (${d.plan.official_code ?? ''})` : '—')}</div>
        <div><b>Institución de origen:</b> ${esc(d.origin_institution || '—')}</div>
    </div>`
}

async function buildDictamen(d: any): Promise<string> {
    const isReval = d.process_type === 'revalidacion'
    const isConv = d.process_type === 'convalidacion' || d.process_type === 'traslado'
    const title = isReval ? 'RESOLUCIÓN DE REVALIDACIÓN DE ESTUDIOS'
        : isConv ? 'DICTAMEN DE CONVALIDACIÓN DE ESTUDIOS'
        : 'RESOLUCIÓN DE EQUIVALENCIA DE ESTUDIOS'

    const rows = (d.items || []).filter((i: any) => i.decision === 'recognized').map((i: any) => `
        <tr>
            <td>${esc(i.origin_code || '')} ${esc(i.origin_name || '')}</td>
            <td style="text-align:center">${esc(i.origin_grade ?? '')}</td>
            <td>${esc(i.dest_code || '')} ${esc(i.dest_name || '')}</td>
            <td style="text-align:center">${esc(i.recognized_grade ?? '')}</td>
            <td style="text-align:center">${esc(i.approval || '')}</td>
        </tr>`).join('')

    const legal = isReval
        ? 'Con fundamento en el Acuerdo número 286 de la SEP y el Lineamiento para la Revalidación de Estudios del Tecnológico Nacional de México, se resuelve revalidar las asignaturas señaladas.'
        : isConv
            ? 'Con fundamento en el Lineamiento para la Convalidación de Estudios del Tecnológico Nacional de México, se convalidan las asignaturas señaladas por corresponder al mismo plan de estudios.'
            : 'Con fundamento en el Acuerdo número 286 de la SEP y el Lineamiento para la Resolución de Equivalencia de Estudios del Tecnológico Nacional de México, se declaran equivalentes las asignaturas señaladas.'

    const qr = await qrTag(d.signature?.verify_url)
    return `<div class="doc">
        ${header(d, title)}
        ${studentBlock(d)}
        <table>
            <thead><tr>
                <th>Materia de origen</th><th>Calif.</th>
                <th>Materia equivalente (destino)</th><th>Calif. asignada</th><th>Tipo</th>
            </tr></thead>
            <tbody>${rows || '<tr><td colspan="5" style="text-align:center">Sin materias reconocidas</td></tr>'}</tbody>
        </table>
        <div class="legal">${legal}</div>
        ${signatureBlock(d.signature, qr)}
    </div>`
}

async function buildCertificado(d: any, cert: any): Promise<string> {
    const rows = (cert?.grades || []).map((g: any) => `
        <tr>
            <td>${esc(g.code || '')}</td>
            <td>${esc(g.subject || '')}</td>
            <td style="text-align:center">${esc(g.credits ?? '')}</td>
            <td style="text-align:center">${esc(g.grade ?? '')}</td>
            <td style="text-align:center">${esc(g.approval || '')}</td>
        </tr>`).join('')
    const qr = await qrTag(d.signature?.verify_url)
    return `<div class="doc">
        ${header(d, 'CERTIFICADO PARCIAL DE ESTUDIOS')}
        <div class="block">
            <div><b>Alumno(a):</b> ${esc(cert?.student?.name || d.student?.name || '—')}</div>
            <div><b>No. de control:</b> ${esc(cert?.student?.num_control || d.student?.num_control || '—')}</div>
        </div>
        <table>
            <thead><tr><th>Clave</th><th>Asignatura</th><th>Créditos</th><th>Calif.</th><th>Tipo</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5" style="text-align:center">Sin registros</td></tr>'}</tbody>
        </table>
        <div class="legal">El presente certificado parcial acredita las asignaturas cursadas por el(la) alumno(a) hasta la fecha de emisión.</div>
        ${signatureBlock(d.signature, qr)}
    </div>`
}

async function buildOficio(d: any): Promise<string> {
    const qr = await qrTag(d.signature?.verify_url)
    return `<div class="doc">
        ${header(d, 'OFICIO DE TRASLADO')}
        <div class="block" style="margin-top:24px">
            <p style="text-align:justify">Por medio del presente se hace constar que el(la) alumno(a)
            <b>${esc(d.student?.name || '—')}</b>, con número de control <b>${esc(d.student?.num_control || '—')}</b>,
            causa baja por traslado de este plantel con destino a <b>${esc(d.origin_institution || '—')}</b>,
            sin inconveniente por parte de esta institución. Se acompaña el certificado parcial de estudios correspondiente.</p>
        </div>
        ${signatureBlock(d.signature, qr)}
    </div>`
}

export async function generateMobilityDocument(type: DocType, d: any, cert?: any): Promise<void> {
    let html = ''
    if (type === 'dictamen') html = await buildDictamen(d)
    else if (type === 'certificado') html = await buildCertificado(d, cert)
    else html = await buildOficio(d)

    const container = document.createElement('div')
    container.innerHTML = STYLE + html
    container.style.position = 'fixed'
    container.style.left = '-10000px'
    document.body.appendChild(container)

    const filename = `${type}-caso-${d.case_id ?? ''}.pdf`
    try {
        await html2pdf().set({
            margin: [8, 8, 8, 8],
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        }).from(container).save()
    } finally {
        document.body.removeChild(container)
    }
}
