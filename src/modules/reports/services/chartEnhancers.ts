import {
    Chart,
    BarController,
    BarElement,
    LineController,
    PointElement,
    LineElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
} from 'chart.js'

import type { ChartSpec } from '@/modules/reports/types/report.type'

Chart.register(BarController, BarElement, LineController, PointElement, LineElement, CategoryScale, LinearScale, Title, Tooltip)

/**
 * Gráficas del reporteador, DEFINIDAS EN EL REPORTE (columna reports.charts),
 * editables desde la herramienta — NO hardcodeadas aquí.
 *
 * Cada spec mapea un tag de imagen `{%var}` a una gráfica que se dibuja en el
 * CLIENTE con Chart.js a partir de un DAO del contexto:
 *   { var, type, source, x, y, yMax?, xTitle?, yTitle?, color?, title? }
 *   - var:    nombre del tag imagen en la plantilla (p. ej. "grafica" → {%grafica})
 *   - type:   'bar' | 'line'
 *   - source: nombre del DAO/variable del contexto con las filas
 *   - x/y:    campos de cada fila para eje X (etiqueta) y eje Y (valor)
 *
 * Pipeline: useReportGenerator.generate() → applyChartEnhancers(report, ctx)
 *           → resolveImages(ctx) → fillDocxTemplate()
 * Doc: docs/evd/reporte-evaluacion-docente.md
 */

/** Dibuja la gráfica fuera de pantalla y devuelve un PNG data-URL. */
function renderChartDataUrl(spec: ChartSpec, rows: any[]): string {
    const labels = rows.map(r => String(r?.[spec.x] ?? ''))
    const values = rows.map(r => Number(r?.[spec.y] ?? 0))
    const color = spec.color || '#93c5fd'

    const canvas = document.createElement('canvas')
    canvas.width = 1120
    canvas.height = 600
    canvas.style.cssText = 'position:fixed;left:-10000px;top:0;width:1120px;height:600px'
    document.body.appendChild(canvas)

    // Fondo blanco (evita PNG transparente al pasar a PDF).
    const whiteBg = {
        id: 'whiteBg',
        beforeDraw(c: any) {
            const cx = c.ctx
            cx.save()
            cx.globalCompositeOperation = 'destination-over'
            cx.fillStyle = '#ffffff'
            cx.fillRect(0, 0, c.width, c.height)
            cx.restore()
        },
    }

    let url = ''
    try {
        const chart = new Chart(canvas, {
            type: spec.type === 'line' ? 'line' : 'bar',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: color,
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    maxBarThickness: 70,
                    ...(spec.type === 'line' ? { fill: false, tension: 0.2 } : {}),
                }],
            },
            plugins: [whiteBg],
            options: {
                responsive: false,
                animation: false,
                devicePixelRatio: 2,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    title: spec.title ? { display: true, text: spec.title, font: { size: 18 } } : { display: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: spec.yMax ?? undefined,
                        title: spec.yTitle ? { display: true, text: spec.yTitle } : { display: false },
                    },
                    x: {
                        title: spec.xTitle ? { display: true, text: spec.xTitle } : { display: false },
                    },
                },
            },
        })
        url = chart.toBase64Image('image/png', 1)
        // Fallback si toBase64Image saliera vacío en algún navegador.
        if (!url || url.length < 200) url = canvas.toDataURL('image/png')
        chart.destroy()
    } finally {
        canvas.remove()
    }
    // eslint-disable-next-line no-console
    console.info(`[chartEnhancers] "${spec.var}": ${values.length} valores, imagen ${url.length} bytes`)
    return url
}

interface ReportLike { code?: string | null; charts?: ChartSpec[] | null }

/**
 * Aplica las gráficas definidas en `report.charts` sobre el contexto: por cada
 * spec, dibuja el PNG desde `ctx[spec.source]` y lo pone en `ctx[spec.var]`.
 */
export async function applyChartEnhancers(report: ReportLike | null | undefined, ctx: Record<string, any>): Promise<void> {
    const charts = Array.isArray(report?.charts) ? report!.charts! : []
    for (const spec of charts) {
        if (!spec?.var || !spec?.source) continue
        try {
            const rows: any[] = Array.isArray(ctx[spec.source]) ? ctx[spec.source] : []
            ctx[spec.var] = rows.length ? renderChartDataUrl(spec, rows) : ''
        } catch (e) {
            console.error(`[chartEnhancers] no se pudo generar la gráfica "${spec.var}"`, e)
            ctx[spec.var] = ''
        }
    }
}
