import type { CollegeBranding, LoginConfig } from '@/modules/auth/services/branding.service'

/** Estilo de fondo del contenedor del login según login_config.background. */
export function backgroundStyle(branding: CollegeBranding | null, config: LoginConfig | null): Record<string, string> {
    const bg = config?.background ?? {}
    const type = bg.type ?? 'image'
    if (type === 'color') {
        return { backgroundColor: bg.color || '#f1f5f9' }
    }
    if (type === 'gradient') {
        const from = bg.gradientFrom || branding?.primary_color || '#4f46e5'
        const to = bg.gradientTo || '#1e293b'
        const angle = bg.gradientAngle ?? 135
        return { backgroundImage: `linear-gradient(${angle}deg, ${from}, ${to})` }
    }
    // image
    const url = bg.imageUrl || branding?.hero_url || '/img/background.png'
    return { backgroundImage: `url('${url}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
}

/** Overlay sobre el fondo (para legibilidad en imágenes). */
export function overlayStyle(config: LoginConfig | null): Record<string, string> | null {
    const o = config?.background?.overlay
    if (!o || o <= 0) return null
    const color = config?.background?.overlayColor || '#000000'
    return { position: 'absolute', inset: '0', backgroundColor: color, opacity: String(Math.min(1, Math.max(0, o))) }
}

/** Estilo de la tarjeta del formulario. */
export function cardStyle(config: LoginConfig | null): Record<string, string> {
    const f = config?.form ?? {}
    const style: Record<string, string> = {}
    if (f.cardWidth) style.maxWidth = `${f.cardWidth}px`
    if (f.cardRadius != null) style.borderRadius = `${f.cardRadius}px`
    if (f.cardBg) style.backgroundColor = f.cardBg
    if (f.cardOpacity != null) style.opacity = String(f.cardOpacity)
    return style
}

/** Clases de alineación del formulario dentro del contenedor. */
export function formPositionClass(config: LoginConfig | null): string {
    const pos = config?.form?.position ?? 'center'
    const align = config?.form?.align ?? 'center'
    const h = pos === 'left' ? 'justify-start' : pos === 'right' ? 'justify-end' : 'justify-center'
    const v = align === 'top' ? 'items-start' : align === 'bottom' ? 'items-end' : 'items-center'
    return `${h} ${v}`
}

/** Estilo raíz con tipografía opcional. */
export function rootTypography(config: LoginConfig | null): Record<string, string> {
    const t = config?.typography ?? {}
    const style: Record<string, string> = {}
    if (t.fontFamily) style.fontFamily = t.fontFamily
    if (t.baseSize) style.fontSize = `${t.baseSize}px`
    return style
}
