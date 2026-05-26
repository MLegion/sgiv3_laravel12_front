import { api } from '@/shared/services/api'
import { apiUrl } from '@/shared/api/config'

export type BrandingAssetKind = 'logo' | 'hero' | 'navbar_logo_left' | 'navbar_logo_right'

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
 * o del login puede leerlo con `var(--brand-primary)` y compatibles.
 */
export function applyBrandingCssVars(branding: CollegeBranding | null) {
    const root = document.documentElement
    if (!branding) {
        root.style.removeProperty('--brand-primary')
        root.style.removeProperty('--brand-primary-hover')
        return
    }
    const primary = branding.primary_color || '#4f46e5'
    root.style.setProperty('--brand-primary', primary)
    root.style.setProperty('--brand-primary-hover', shadeHex(primary, -10))
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
