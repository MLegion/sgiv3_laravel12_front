<template>
    <!-- El preview vive dentro de un <iframe> aislado: su CSS, layout y cualquier
         error quedan encapsulados y NO pueden afectar la interfaz del admin. -->
    <iframe
        class="w-full h-full block"
        style="border: 0"
        sandbox=""
        :srcdoc="srcDoc"
        title="Vista previa del login"
    ></iframe>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { sanitizeLoginHtml } from '@/modules/auth/components/login/sanitizeLoginHtml'
import type { CollegeBranding, LoginConfig, LoginTemplate } from '@/modules/auth/services/branding.service'

const props = defineProps<{
    template: LoginTemplate
    branding: CollegeBranding | null
    config: LoginConfig | null
    collegeName?: string | null
}>()

const primary = computed(() => props.branding?.primary_color || '#4f46e5')
const title = computed(() => props.branding?.welcome_title || props.collegeName || 'Colegio')
const subtitle = computed(() => props.branding?.welcome_subtitle || '')
const logo = computed(() => props.branding?.logo_url || '/img/ITSTB.jpg')
const show = computed(() => props.config?.show ?? {})

function esc(s: string): string {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Estilo de fondo (string CSS inline). */
function bgCss(): string {
    const b = props.config?.background ?? {}
    const type = b.type ?? 'image'
    if (type === 'color') return `background:${b.color || '#f1f5f9'}`
    if (type === 'gradient') {
        const from = b.gradientFrom || primary.value
        const to = b.gradientTo || '#1e293b'
        return `background:linear-gradient(${b.gradientAngle ?? 135}deg, ${from}, ${to})`
    }
    const url = b.imageUrl || props.branding?.hero_url || '/img/background.png'
    return `background:#e2e8f0 url('${url}') center/cover no-repeat`
}

function overlayCss(defaultOverlay = 0): string {
    const o = props.config?.background?.overlay ?? defaultOverlay
    if (!o || o <= 0) return ''
    const color = props.config?.background?.overlayColor || '#000000'
    return `<div style="position:absolute;inset:0;background:${color};opacity:${Math.min(1, Math.max(0, o))}"></div>`
}

function cardCss(): string {
    const f = props.config?.form ?? {}
    let s = 'position:relative;background:#fff;border-radius:14px;padding:18px;box-shadow:0 10px 30px rgba(0,0,0,.15)'
    if (f.cardBg) s += `;background:${f.cardBg}`
    if (f.cardRadius != null) s += `;border-radius:${f.cardRadius}px`
    if (f.cardOpacity != null) s += `;opacity:${f.cardOpacity}`
    return s
}

/** Alineación del contenedor según form.position/align. */
function alignCss(): string {
    const pos = props.config?.form?.position ?? 'center'
    const al = props.config?.form?.align ?? 'center'
    const h = pos === 'left' ? 'flex-start' : pos === 'right' ? 'flex-end' : 'center'
    const v = al === 'top' ? 'flex-start' : al === 'bottom' ? 'flex-end' : 'center'
    return `justify-content:${h};align-items:${v}`
}

/** Formulario simulado (inline). */
function formHtml(): string {
    const button = props.config?.colors?.button || primary.value
    const link = props.config?.colors?.link || primary.value
    const aspir = show.value.aspirantesLink !== false
        ? `<div style="text-align:center;font-size:11px;color:#64748b;padding-top:2px">¿Eres aspirante? <span style="color:${link}">Portal de inscripciones</span></div>`
        : ''
    return `<div style="display:flex;flex-direction:column;gap:10px">
      <div><div style="font-size:11px;color:#64748b;margin-bottom:3px">Usuario o correo</div><div style="height:34px;border:1px solid #cbd5e1;border-radius:6px;background:#fff"></div></div>
      <div><div style="font-size:11px;color:#64748b;margin-bottom:3px">Contraseña</div><div style="height:34px;border:1px solid #cbd5e1;border-radius:6px;background:#fff"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:11px"><span style="color:#64748b">Recordarme</span><span style="color:${link}">Recuperar contraseña</span></div>
      <div style="height:38px;border-radius:6px;background:${button};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;letter-spacing:.03em">INGRESAR</div>
      ${aspir}
    </div>`
}

function headerLogos(center: string): string {
    const tecnm = show.value.tecnmLogo !== false ? `<img src="/img/TecNM.png" style="height:34px;object-fit:contain"/>` : '<span></span>'
    const lg = show.value.logos !== false ? `<img src="${esc(logo.value)}" style="height:34px;object-fit:contain"/>` : '<span></span>'
    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px">${tecnm}${center}${lg}</div>`
}

function bodyHtml(): string {
    const t = props.template
    const sub = subtitle.value && show.value.subtitle !== false
        ? `<div style="font-size:11px;color:#64748b;margin-top:2px">${esc(subtitle.value)}</div>` : ''

    if (t === 'split') {
        const ratio = Math.min(70, Math.max(30, props.config?.split?.formRatio ?? 42))
        const imageSide = props.config?.split?.imageSide ?? 'left'
        const panel = `<div style="position:relative;flex-basis:${100 - ratio}%;${bgCss()};display:flex;align-items:center;justify-content:center;color:#fff;padding:16px">
            ${overlayCss()}
            <div style="position:relative;text-align:center">
              ${show.value.logos !== false ? `<img src="${esc(logo.value)}" style="height:40px;object-fit:contain;margin-bottom:8px"/>` : ''}
              <div style="font-size:15px;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,.4)">${esc(title.value)}</div>
            </div></div>`
        const form = `<div style="flex-basis:${ratio}%;background:#fff;display:flex;align-items:center;justify-content:center;padding:16px">
            <div style="width:100%;max-width:300px">
              <div style="font-size:13px;font-weight:600;color:${primary.value};margin-bottom:10px">Iniciar sesión</div>
              ${formHtml()}
            </div></div>`
        return `<div style="display:flex;height:100%;${imageSide === 'right' ? 'flex-direction:row-reverse' : ''}">${panel}${form}</div>`
    }

    // centered / hero / minimal comparten: pantalla con fondo + card centrado
    let screenBg = bgCss()
    let overlay = overlayCss()
    if (t === 'hero') { overlay = overlayCss(0.35) || `<div style="position:absolute;inset:0;background:#000;opacity:.35"></div>` }
    if (t === 'minimal' && !props.config?.background) screenBg = 'background:#f8fafc'

    let cardInner = ''
    if (t === 'centered') {
        const center = `<div style="text-align:center;font-size:13px;font-weight:600;color:${primary.value};line-height:1.2">${esc(title.value)}${sub}</div>`
        cardInner = headerLogos(center) + formHtml()
    } else {
        const head = `<div style="text-align:center;margin-bottom:10px">
            ${show.value.logos !== false ? `<img src="${esc(logo.value)}" style="height:${t === 'minimal' ? 32 : 38}px;object-fit:contain;margin:0 auto 6px;display:block"/>` : ''}
            <div style="font-size:${t === 'minimal' ? 13 : 14}px;font-weight:700;color:${primary.value}">${esc(title.value)}</div>${sub}
          </div>`
        cardInner = head + formHtml()
    }
    const maxW = t === 'centered' ? 460 : t === 'minimal' ? 260 : 300
    const cardExtra = t === 'minimal' && !props.config?.form?.cardBg ? 'box-shadow:none;background:transparent' : ''
    return `<div style="position:relative;width:100%;height:100%;display:flex;padding:16px;${alignCss()};${screenBg}">
        ${overlay}
        <div style="${cardCss()};${cardExtra};max-width:${maxW}px;width:88%">${cardInner}</div>
      </div>`
}

function interpolate(raw: string): string {
    const b = props.branding
    const map: Record<string, string> = {
        title: b?.welcome_title || '', subtitle: b?.welcome_subtitle || '',
        logo: b?.logo_url || '', hero: b?.hero_url || '', primary: primary.value, tecnm: '/img/TecNM.png',
    }
    return raw.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (_m, k) => map[k] ?? '')
}

const srcDoc = computed(() => {
    const font = props.config?.typography?.fontFamily || 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    const base = props.config?.typography?.baseSize ? `${props.config.typography.baseSize}px` : '14px'

    let content: string
    if (props.template === 'custom') {
        // HTML libre saneado + shim mínimo de utilidades (sin Tailwind en el iframe),
        // y el marcador del formulario mostrado como placeholder.
        const html = sanitizeLoginHtml(interpolate(props.config?.customHtml || ''))
        content = html || '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px">Escribe tu HTML personalizado…</div>'
    } else {
        content = bodyHtml()
    }

    const shim = `
      *{box-sizing:border-box;margin:0;padding:0}
      html,body{height:100%;font-family:${font};font-size:${base};color:#1e293b}
      img{max-width:100%}
      /* shim de utilidades para HTML personalizado */
      .min-h-screen{min-height:100%}
      .flex{display:flex}.items-center{align-items:center}.justify-center{justify-content:center}
      .flex-col{flex-direction:column}.text-center{text-align:center}.w-full{width:100%}.relative{position:relative}
      [data-login-form]{min-height:96px;border:2px dashed rgba(100,116,139,.5);border-radius:8px;display:flex;align-items:center;justify-content:center}
      [data-login-form]::before{content:'Formulario de acceso';font-size:11px;color:rgba(100,116,139,.9)}
    `
    return `<!doctype html><html><head><meta charset="utf-8"><style>${shim}</style></head><body>${content}</body></html>`
})
</script>
