import { ref } from 'vue'
// docx-preview y html2pdf.js se cargan con import() dinámico dentro de las
// funciones que los usan (preview/generatePdf): son pesados (~cientos de KB)
// y sólo hacen falta al previsualizar/exportar, no en el bundle inicial.
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { fillDocxTemplate } from '@/modules/reports/services/docxGenerator'
import type { Report } from '@/modules/reports/types/report.type'

export interface GenerateOptions {
    reportId?:   number | string
    reportCode?: string
    params?:     Record<string, unknown>
    filename?:   string
}

export type ReportUnavailableReason = 'missing' | 'inactive'

export class ReportFormatUnavailableError extends Error {
    readonly notAvailable = true as const
    constructor(
        public readonly code: string,
        public readonly reason: ReportUnavailableReason,
        message: string,
    ) {
        super(message)
        this.name = 'ReportFormatUnavailableError'
    }
}

/**
 * Composable headless para generar reportes desde cualquier parte de la app.
 *
 * Ejecuta DAOs vinculados al reporte con los params dados, llena la plantilla Word
 * con docxtemplater y devuelve un Blob listo. También expone operaciones de alto
 * nivel: descargar DOCX, renderizar preview en un contenedor, imprimir/PDF.
 *
 * Uso:
 *   const { loading, error, generate, download, preview, printPdf } = useReportGenerator()
 *   await download({ reportId: 6, params: { teacher_id: 5 } })
 */
export function useReportGenerator() {
    const loading = ref(false)
    const error   = ref<string | null>(null)

    async function fetchReport(options: GenerateOptions): Promise<Report> {
        if (options.reportCode) {
            try {
                const { data } = await api.get(API.REPORTS_API.reports.byCode(options.reportCode))
                return data as Report
            } catch (e: any) {
                if (e?.response?.status === 404) {
                    const payload = e.response.data ?? {}
                    throw new ReportFormatUnavailableError(
                        payload.code ?? options.reportCode,
                        (payload.reason as ReportUnavailableReason) ?? 'missing',
                        payload.message ?? 'Formato no disponible.',
                    )
                }
                throw e
            }
        }
        if (options.reportId) {
            const { data } = await api.get(API.REPORTS_API.reports.byId(options.reportId))
            return data as Report
        }
        throw new Error('Debe indicar reportId o reportCode.')
    }

    async function runDaos(report: Report, reportId: number | string, params: Record<string, unknown>) {
        const context: Record<string, any> = {}
        for (const d of report.daos ?? []) {
            if (!d.id || !d.varName) continue
            const { data } = await api.post(
                API.REPORTS_API.daos.execute(d.id),
                { params, report_id: reportId },
            )
            const rows = data.data
            context[d.varName] = rows
            // DAO de encabezado (una sola fila): además de exponerlo como `{#var}…{/var}`,
            // aplanamos sus campos a la raíz del contexto para que la plantilla pueda usar
            // `{campo}` directo (la tabla de datos de la SOLICITUD usa {docente}, {periodo},
            // {modalidad}… no {#datos}). Los DAOs de detalle (materias, impartidas) se dejan
            // solo como arreglo para el loop.
            if (Array.isArray(rows) && rows.length === 1 && rows[0] && typeof rows[0] === 'object') {
                Object.assign(context, rows[0])
            }
        }
        return context
    }

    async function fetchTemplate(reportId: number | string): Promise<Blob> {
        const res = await api.get(API.REPORTS_API.reports.template(reportId), { responseType: 'blob' })
        return res.data as Blob
    }

    /** Ejecuta todo el pipeline y devuelve el Blob DOCX ya relleno. */
    async function generate(options: GenerateOptions): Promise<{ blob: Blob; filename: string; report: Report }> {
        loading.value = true
        error.value   = null
        try {
            const report  = await fetchReport(options)
            if (!report.hasTemplate && !report.templatePath) {
                throw new Error('El reporte no tiene plantilla Word asociada.')
            }
            const reportId = report.id
            const context  = await runDaos(report, reportId, options.params ?? {})
            const tpl      = await fetchTemplate(reportId)
            const blob     = await fillDocxTemplate(tpl, context)
            const filename = `${options.filename ?? report.code ?? report.name ?? 'reporte'}.docx`
            return { blob, filename, report }
        } catch (e: any) {
            error.value = e?.response?.data?.message ?? e?.message ?? 'Error al generar el reporte.'
            throw e
        } finally {
            loading.value = false
        }
    }

    /** Descarga el DOCX directo. */
    async function download(options: GenerateOptions): Promise<void> {
        const { blob, filename } = await generate(options)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }

    /** Renderiza el DOCX como HTML dentro de un contenedor (usando docx-preview). */
    async function preview(options: GenerateOptions, host: HTMLElement): Promise<Blob> {
        const { blob } = await generate(options)
        const { renderAsync } = await import('docx-preview')
        host.innerHTML = ''
        await renderAsync(blob, host, undefined, {
            className:    'docx-preview',
            inWrapper:    true,
            breakPages:   true,
            experimental: true,
            useBase64URL: true,
        })
        return blob
    }

    /** Convierte el DOCX a un PDF Blob client-side (vía html2pdf.js sobre el docx-preview). */
    async function generatePdf(options: GenerateOptions): Promise<{ blob: Blob; filename: string; report: Report }> {
        const { blob: docxBlob, report } = await generate(options)
        const [{ renderAsync }, { default: html2pdf }] = await Promise.all([
            import('docx-preview'),
            // @ts-ignore — html2pdf.js no tiene types oficiales
            import('html2pdf.js'),
        ])
        const host = document.createElement('div')
        host.style.cssText = 'position:absolute;left:-99999px;top:0;width:816px;'  // ~Letter width
        document.body.appendChild(host)
        try {
            await renderAsync(docxBlob, host, undefined, {
                className:    'docx-preview',
                inWrapper:    true,
                breakPages:   true,
                experimental: true,
                useBase64URL: true,
            })
            const pdfBlob: Blob = await html2pdf()
                .set({
                    margin:      [10, 10, 10, 10],
                    filename:    `${options.filename ?? report.code ?? report.name ?? 'reporte'}.pdf`,
                    image:       { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                    jsPDF:       { unit: 'mm', format: 'letter', orientation: 'portrait' },
                    pagebreak:   { mode: ['css', 'legacy'] },
                } as any)
                .from(host)
                .output('blob')

            const filename = `${options.filename ?? report.code ?? report.name ?? 'reporte'}.pdf`
            return { blob: pdfBlob, filename, report }
        } finally {
            document.body.removeChild(host)
        }
    }

    /** Descarga el PDF directamente. */
    async function downloadPdf(options: GenerateOptions): Promise<void> {
        const { blob, filename } = await generatePdf(options)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }

    /**
     * Genera el DOCX (cliente) y lo convierte a PDF en el servidor (LibreOffice)
     * para una vista previa PAGINADA fiel. Devuelve el Blob PDF y su nombre.
     * Para usar en un <iframe>: crear un objectURL del blob.
     */
    async function renderPdf(options: GenerateOptions): Promise<{ blob: Blob; filename: string; report: Report }> {
        const { blob: docxBlob, filename: docxName, report } = await generate(options)
        const form = new FormData()
        form.append('file', docxBlob, docxName)
        const res = await api.post(API.REPORTS_API.convertPdf, form, { responseType: 'blob' })
        const filename = `${options.filename ?? report.code ?? report.name ?? 'reporte'}.pdf`
        return { blob: res.data as Blob, filename, report }
    }

    return { loading, error, generate, download, preview, generatePdf, downloadPdf, renderPdf }
}
