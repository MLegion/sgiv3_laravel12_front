// Chart.js UMD vendorizado (el paquete bloquea el import profundo por "exports").
// Se inyecta como texto dentro del iframe sandbox.
import chartUmd from './vendor/chart.umd.min.js?raw'

/**
 * Ejecutor SANDBOX de scripts de reporte.
 *
 * El script (definido por el reporte, editable en el reporteador) corre dentro
 * de un iframe `sandbox="allow-scripts"` SIN `allow-same-origin` → origen opaco:
 * NO ve el DOM padre, NI cookies/localStorage, y su fetch va sin credenciales.
 * La comunicación es por postMessage (structured clone), así que solo pueden
 * volver DATOS planos (nunca funciones/DOM). La salida se valida:
 *   - images: solo data-URL RASTER (png/jpeg/webp) y con tope de tamaño (no SVG).
 *   - fields: datos planos (structured-clone garantiza que no hay código).
 *
 * Contrato del script (recibe `context`, `Chart`, `helpers`):
 *   return { images: { grafica: "data:image/png;base64,..." }, fields: { ... } }
 *   helpers.barChart(labels, values, opts) → data-URL PNG (atajo con Chart.js).
 *   helpers.canvas(w, h) → <canvas> para dibujar a mano y usar toDataURL().
 */

export interface SandboxResult {
    images: Record<string, string>
    fields: Record<string, any>
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB por imagen

function isSafeRasterDataUrl(v: unknown): v is string {
    if (typeof v !== 'string') return false
    // Solo raster; SVG queda excluido a propósito (puede llevar <script>).
    if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(v)) return false
    if (v.length > Math.ceil(MAX_IMAGE_BYTES * 1.37)) return false // base64 ≈ 4/3 del binario
    return true
}

function buildSrcdoc(): string {
    return `<!doctype html><html><head><meta charset="utf-8">`
        + `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; img-src data:; style-src 'unsafe-inline'">`
        + `</head><body><script>${chartUmd}<\/script><script>`
        + `(function(){`
        + `function reply(m){parent.postMessage(Object.assign({__rptsbx:1},m),'*');}`
        + `window.addEventListener('message',function(ev){`
        + `var d=ev.data||{};if(d.__rptsbx_run!==true)return;`
        + `try{`
        + `var Chart=window.Chart;var context=d.context;`
        + `function canvas(w,h){var c=document.createElement('canvas');c.width=w||1120;c.height=h||600;document.body.appendChild(c);return c;}`
        + `function barChart(labels,values,opts){opts=opts||{};var c=canvas(opts.width,opts.height);`
        + `var ch=new Chart(c,{type:opts.type||'bar',data:{labels:labels,datasets:[{data:values,backgroundColor:opts.color||'#93c5fd',borderColor:'#3b82f6',borderWidth:1,maxBarThickness:70}]},`
        + `options:{responsive:false,animation:false,devicePixelRatio:2,plugins:{legend:{display:false},tooltip:{enabled:false}},`
        + `scales:{y:{beginAtZero:true,max:opts.yMax,title:opts.yTitle?{display:true,text:opts.yTitle}:{display:false}},x:{title:opts.xTitle?{display:true,text:opts.xTitle}:{display:false}}}}});`
        + `var u=ch.toBase64Image('image/png',1);ch.destroy();return u;}`
        + `var fn=new Function('context','Chart','helpers',d.script);`
        + `var result=fn(context,Chart,{canvas:canvas,barChart:barChart});`
        + `reply({ok:true,result:result});`
        + `}catch(e){reply({ok:false,error:String((e&&e.message)||e)});}`
        + `});`
        + `reply({ready:true});`
        + `})();`
        + `<\/script></body></html>`
}

/** Corre el script en el sandbox y devuelve {images, fields} validados. Nunca rechaza. */
export async function runReportScript(
    script: string,
    context: Record<string, any>,
    timeoutMs = 6000,
): Promise<SandboxResult> {
    return new Promise((resolve) => {
        const empty: SandboxResult = { images: {}, fields: {} }
        let done = false
        const iframe = document.createElement('iframe')
        iframe.setAttribute('sandbox', 'allow-scripts') // sin allow-same-origin (origen opaco)
        iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:10px;height:10px;border:0'

        const finish = (res: SandboxResult) => {
            if (done) return
            done = true
            clearTimeout(timer)
            window.removeEventListener('message', onMsg)
            try { iframe.remove() } catch { /* noop */ }
            resolve(res)
        }
        const timer = setTimeout(() => { console.warn('[sandbox] timeout del script de reporte'); finish(empty) }, timeoutMs)

        const onMsg = (ev: MessageEvent) => {
            if (ev.source !== iframe.contentWindow) return
            const d: any = ev.data
            if (!d || d.__rptsbx !== 1) return
            if (d.ready) {
                iframe.contentWindow?.postMessage({ __rptsbx_run: true, script, context }, '*')
                return
            }
            if (d.ok === false) { console.error('[sandbox] error en el script del reporte:', d.error); finish(empty); return }
            if (d.ok === true) {
                const r = d.result || {}
                const images: Record<string, string> = {}
                if (r.images && typeof r.images === 'object') {
                    for (const k of Object.keys(r.images)) {
                        if (isSafeRasterDataUrl(r.images[k])) images[k] = r.images[k]
                        else console.warn(`[sandbox] imagen "${k}" rechazada (solo PNG/JPEG/WEBP base64 ≤ 5MB)`)
                    }
                }
                const fields = (r.fields && typeof r.fields === 'object') ? r.fields : {}
                finish({ images, fields })
            }
        }

        window.addEventListener('message', onMsg)
        iframe.srcdoc = buildSrcdoc()
        document.body.appendChild(iframe)
    })
}
