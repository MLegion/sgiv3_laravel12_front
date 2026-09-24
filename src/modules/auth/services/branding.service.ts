import { api } from '@/shared/services/api'
import { apiUrl } from '@/shared/api/config'

export type BrandingAssetKind = 'logo' | 'hero' | 'navbar_logo_left' | 'navbar_logo_right'

export type LoginTemplate = 'centered' | 'split' | 'hero' | 'minimal' | 'custom'

/** Configuración avanzada del login (JSON en AppConfig). Todo opcional. */
export interface LoginConfig {
    background?: {
        type?: 'color' | 'gradient' | 'image'
        color?: string
        gradientFrom?: string
        gradientTo?: string
        gradientAngle?: number
        imageUrl?: string            // si vacío, se usa el hero del branding
        overlay?: number             // 0..1
        overlayColor?: string
    }
    form?: {
        position?: 'left' | 'center' | 'right'
        align?: 'top' | 'center' | 'bottom'
        cardWidth?: number           // px
        cardRadius?: number          // px
        cardOpacity?: number         // 0..1
        cardBg?: string
    }
    split?: { imageSide?: 'left' | 'right'; formRatio?: number /* % del ancho para el form */ }
    show?: { hero?: boolean; logos?: boolean; subtitle?: boolean; tecnmLogo?: boolean; aspirantesLink?: boolean }
    colors?: { button?: string; buttonText?: string; link?: string; text?: string }
    typography?: { fontFamily?: string; titleSize?: number; baseSize?: number }
    /** Modo avanzado: HTML personalizado (sanitizado). Debe incluir el marcador del formulario. */
    customHtml?: string
}

export type AppThemePreset = 'light' | 'dark-sidebar' | 'brand-sidebar' | 'slate' | 'custom'
export type NavbarVariant = 'light' | 'brand' | 'dark'

/** Tema de la app autenticada (navbar + sidebar + contenido). Todo opcional. */
export interface AppTheme {
    preset?: AppThemePreset
    contentBg?: string
    navbar?: {
        variant?: NavbarVariant
        bg?: string
        text?: string
        muted?: string
        border?: string
    }
    sidebar?: {
        bg?: string
        text?: string
        muted?: string
        border?: string
        hoverBg?: string
        hoverText?: string
        activeBg?: string
        activeText?: string
        width?: number   // px (sidebar expandido)
    }
}

export interface CollegeBranding {
    primary_color: string
    welcome_title: string | null
    welcome_subtitle: string | null
    navbar_title: string | null
    footer_text: string | null
    logo_url: string | null
    hero_url: string | null
    navbar_logo_left_url: string | null
    navbar_logo_right_url: string | null
    login_template: LoginTemplate
    login_config: LoginConfig
    app_theme: AppTheme
}

export interface CollegeBrandingResolved {
    college: {
        id: number
        name: string
        short_name: string
    }
    branding: CollegeBranding
}

const STORAGE_KEY = 'sgiv3.branding'

export async function resolveBrandingByShortname(shortname: string): Promise<CollegeBrandingResolved | null> {
    try {
        const { data } = await api.get<CollegeBrandingResolved>(
            apiUrl(`/auth/college-by-shortname/${encodeURIComponent(shortname)}`),
        )
        return data
    } catch (e: any) {
        if (e?.response?.status === 404) return null
        throw e
    }
}

export async function resolveBrandingByCollegeId(collegeId: number): Promise<CollegeBrandingResolved | null> {
    try {
        const { data } = await api.get<CollegeBrandingResolved>(apiUrl(`/auth/branding/${collegeId}`))
        return data
    } catch (e: any) {
        if (e?.response?.status === 404) return null
        throw e
    }
}

/**
 * Devuelve el college default fijado por el SUPERADMIN para /auth/login (sin
 * shortname). Si no hay default, college es null y el frontend renderiza el
 * selector original.
 */
export async function resolveLoginDefault(): Promise<CollegeBrandingResolved | null> {
    try {
        const { data } = await api.get<{ college: CollegeBrandingResolved['college'] | null; branding: CollegeBrandingResolved['branding'] | null }>(
            apiUrl('/auth/login-default'),
        )
        if (!data.college || !data.branding) return null
        return { college: data.college, branding: data.branding }
    } catch {
        return null
    }
}

export async function fetchAdminBranding(): Promise<CollegeBrandingResolved> {
    const { data } = await api.get<CollegeBrandingResolved>(apiUrl('/college/branding'))
    return data
}

export async function updateAdminBranding(payload: {
    primary_color?: string | null
    welcome_title?: string | null
    welcome_subtitle?: string | null
    navbar_title?: string | null
    footer_text?: string | null
    login_template?: LoginTemplate | null
    login_config?: LoginConfig | null
    app_theme?: AppTheme | null
}): Promise<{ branding: CollegeBranding }> {
    const { data } = await api.put<{ branding: CollegeBranding }>(apiUrl('/college/branding'), payload)
    return data
}

export async function uploadAdminBrandingAsset(kind: BrandingAssetKind, file: File): Promise<{ branding: CollegeBranding }> {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await api.post<{ branding: CollegeBranding }>(
        apiUrl(`/college/branding/${kind}`),
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
}

export async function deleteAdminBrandingAsset(kind: BrandingAssetKind): Promise<{ branding: CollegeBranding }> {
    const { data } = await api.delete<{ branding: CollegeBranding }>(apiUrl(`/college/branding/${kind}`))
    return data
}

/**
 * Aplica el branding como variables CSS sobre :root. Cualquier estilo de la app
 * o del login puede leerlo con `var(--brand-primary)` y compatibles. Además
 * proyecta el tema de la app (navbar/sidebar/contenido) como variables --app-*.
 */
export function applyBrandingCssVars(branding: CollegeBranding | null) {
    const root = document.documentElement
    if (!branding) {
        root.style.removeProperty('--brand-primary')
        root.style.removeProperty('--brand-primary-hover')
        for (const key of Object.keys(themePresetVars('light', '#4f46e5'))) {
            root.style.removeProperty(key)
        }
        return
    }
    const primary = branding.primary_color || '#4f46e5'
    root.style.setProperty('--brand-primary', primary)
    root.style.setProperty('--brand-primary-hover', shadeHex(primary, -10))

    const vars = resolveAppThemeVars(branding.app_theme ?? null, primary)
    for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value)
    }
}

/** Variables base de cada preset de tema (con el color primario inyectado). */
function themePresetVars(preset: AppThemePreset, primary: string): Record<string, string> {
    const light: Record<string, string> = {
        '--app-content-bg':        '#f8fafc',
        '--app-navbar-bg':         '#ffffff',
        '--app-navbar-text':       '#1e293b',
        '--app-navbar-muted':      '#94a3b8',
        '--app-navbar-border':     '#e2e8f0',
        '--app-sidebar-bg':        '#ffffff',
        '--app-sidebar-text':      '#475569',
        '--app-sidebar-muted':     '#94a3b8',
        '--app-sidebar-border':    '#e2e8f0',
        '--app-sidebar-hover-bg':  '#f1f5f9',
        '--app-sidebar-hover-text': primary,
        '--app-sidebar-active-bg':  primary,
        '--app-sidebar-active-text': '#ffffff',
        '--app-sidebar-width':     '18rem',
    }
    if (preset === 'dark-sidebar') {
        return { ...light,
            '--app-sidebar-bg': '#0f172a', '--app-sidebar-text': '#cbd5e1', '--app-sidebar-muted': '#64748b',
            '--app-sidebar-border': '#1e293b', '--app-sidebar-hover-bg': '#1e293b', '--app-sidebar-hover-text': '#ffffff',
        }
    }
    if (preset === 'slate') {
        return { ...light,
            '--app-content-bg': '#f1f5f9',
            '--app-sidebar-bg': '#1e293b', '--app-sidebar-text': '#cbd5e1', '--app-sidebar-muted': '#64748b',
            '--app-sidebar-border': '#334155', '--app-sidebar-hover-bg': '#334155', '--app-sidebar-hover-text': '#ffffff',
        }
    }
    if (preset === 'brand-sidebar') {
        return { ...light,
            '--app-sidebar-bg': primary, '--app-sidebar-text': 'rgba(255,255,255,0.85)', '--app-sidebar-muted': 'rgba(255,255,255,0.55)',
            '--app-sidebar-border': 'rgba(255,255,255,0.15)', '--app-sidebar-hover-bg': 'rgba(255,255,255,0.12)', '--app-sidebar-hover-text': '#ffffff',
            '--app-sidebar-active-bg': shadeHex(primary, -20), '--app-sidebar-active-text': '#ffffff',
        }
    }
    return light
}

/** Combina preset + variante de navbar + overrides explícitos → variables CSS. */
export function resolveAppThemeVars(theme: AppTheme | null, primary: string): Record<string, string> {
    const preset = (theme?.preset ?? 'light')
    const vars = themePresetVars(preset === 'custom' ? 'light' : preset, primary)

    // Variante de navbar (independiente del preset del sidebar).
    const nv = theme?.navbar?.variant
    if (nv === 'brand') {
        vars['--app-navbar-bg'] = primary
        vars['--app-navbar-text'] = '#ffffff'
        vars['--app-navbar-muted'] = 'rgba(255,255,255,0.7)'
        vars['--app-navbar-border'] = shadeHex(primary, -12)
    } else if (nv === 'dark') {
        vars['--app-navbar-bg'] = '#0f172a'
        vars['--app-navbar-text'] = '#e2e8f0'
        vars['--app-navbar-muted'] = '#64748b'
        vars['--app-navbar-border'] = '#1e293b'
    }

    // Overrides explícitos (modo avanzado): solo pisan si están definidos.
    const set = (key: string, value?: string | null) => { if (value) vars[key] = value }
    set('--app-content-bg', theme?.contentBg)
    set('--app-navbar-bg', theme?.navbar?.bg)
    set('--app-navbar-text', theme?.navbar?.text)
    set('--app-navbar-muted', theme?.navbar?.muted)
    set('--app-navbar-border', theme?.navbar?.border)
    set('--app-sidebar-bg', theme?.sidebar?.bg)
    set('--app-sidebar-text', theme?.sidebar?.text)
    set('--app-sidebar-muted', theme?.sidebar?.muted)
    set('--app-sidebar-border', theme?.sidebar?.border)
    set('--app-sidebar-hover-bg', theme?.sidebar?.hoverBg)
    set('--app-sidebar-hover-text', theme?.sidebar?.hoverText)
    set('--app-sidebar-active-bg', theme?.sidebar?.activeBg)
    set('--app-sidebar-active-text', theme?.sidebar?.activeText)
    if (theme?.sidebar?.width) vars['--app-sidebar-width'] = `${theme.sidebar.width}px`

    return vars
}

export function cacheBranding(payload: CollegeBrandingResolved | null) {
    if (!payload) {
        localStorage.removeItem(STORAGE_KEY)
        return
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch { /* ignorar */ }
}

export function readCachedBranding(): CollegeBrandingResolved | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) as CollegeBrandingResolved : null
    } catch {
        return null
    }
}

/** Oscurece o aclara un hex en porcentaje (-100..100). */
function shadeHex(hex: string, percent: number): string {
    const c = hex.replace('#', '')
    if (c.length !== 6 && c.length !== 3) return hex
    const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c
    const r = Math.max(0, Math.min(255, parseInt(full.slice(0, 2), 16) + Math.round(255 * percent / 100)))
    const g = Math.max(0, Math.min(255, parseInt(full.slice(2, 4), 16) + Math.round(255 * percent / 100)))
    const b = Math.max(0, Math.min(255, parseInt(full.slice(4, 6), 16) + Math.round(255 * percent / 100)))
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
