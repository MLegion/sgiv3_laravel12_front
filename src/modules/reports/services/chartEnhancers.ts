import {
    Chart,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
} from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip)

/**
 * "Enhancers" por código de reporte: pre-procesan el contexto del reporteador
 * ANTES de resolver imágenes/rellenar la plantilla, para inyectar campos
 * calculados en el cliente (p. ej. una gráfica renderizada con Chart.js como
 * PNG data-URL, que el módulo de imágenes embebe en `{%campo}`).
 */
type Enhancer = (ctx: Record<string, any>) => void | Promise<void>

/** Dibuja una gráfica de barras fuera de pantalla y devuelve un PNG data-URL. */
function barChartDataUrl(
    labels: string[],
    values: number[],
    opts: { yMax?: number; xTitle?: string; yTitle?: string; title?: string } = {},
): string {
    // El canvas debe existir en el DOM y tener tamaño para que Chart.js dibuje
    // de forma síncrona (con animation:false); si no, toBase64Image sale vacío.
    const canvas = document.createElement('canvas')
    canvas.width = 1120
    canvas.height = 600
    canvas.style.width = '1120px'
    canvas.style.height = '600px'
    canvas.style.position = 'fixed'
    canvas.style.left = '-10000px'
    canvas.style.top = '0'
    document.body.appendChild(canvas)

    let url = ''
    try {
        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: '#93c5fd',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    maxBarThickness: 70,
                }],
            },
            options: {
                responsive: false,
                animation: false,
                devicePixelRatio: 2,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    title: opts.title ? { display: true, text: opts.title, font: { size: 18 } } : { display: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: opts.yMax,
                        title: opts.yTitle ? { display: true, text: opts.yTitle } : { display: false },
                        ticks: { stepSize: 0.5 },
                    },
                    x: {
                        title: opts.xTitle ? { display: true, text: opts.xTitle } : { display: false },
                    },
                },
            },
        })
        // Método oficial de Chart.js (más fiable que canvas.toDataURL en canvas suelto).
        url = chart.toBase64Image('image/png', 1)
        chart.destroy()
    } finally {
        canvas.remove()
    }
    return url
}

const enhancers: Record<string, Enhancer> = {
    // Evaluación docente: barras con el puntaje por aspecto (A–J).
    'RPT.EVALUACION_DOCENTE': (ctx) => {
        const aspectos: any[] = Array.isArray(ctx.aspectos) ? ctx.aspectos : []
        if (!aspectos.length) { ctx.grafica = ''; return }
        const labels = aspectos.map(a => String(a.letra ?? a.area_code ?? ''))
        const values = aspectos.map(a => Number(a.puntaje ?? a.avg_score ?? 0))
        try {
            ctx.grafica = barChartDataUrl(labels, values, {
                yMax: 5,
                yTitle: 'PUNTAJE',
                xTitle: 'ASPECTOS EVALUADOS',
            })
        } catch (e) {
            console.error('[chartEnhancers] RPT.EVALUACION_DOCENTE: no se pudo generar la gráfica', e)
            ctx.grafica = ''
        }
    },
}

/** Aplica el enhancer registrado para el código de reporte (si existe). */
export async function applyChartEnhancers(code: string | null | undefined, ctx: Record<string, any>): Promise<void> {
    if (!code) return
    const fn = enhancers[code]
    if (fn) await fn(ctx)
}
