import type { TipTapDoc } from '../services/templateEngine'

export interface ReportDao {
    id: number
    name: string
    type: number
    varName: string
    preScript:  string | null
    postScript: string | null
    dataSource: string
    status: boolean
}

export interface PageConfig {
    size:        'A4' | 'Letter' | 'Legal'
    orientation: 'portrait' | 'landscape'
    margins: {
        top:    number   // mm
        right:  number
        bottom: number
        left:   number
    }
    background:    string   // color CSS, ej: '#ffffff'
    headerHeight:  number   // mm
    footerHeight:  number   // mm
}

export interface ReportStructure {
    version:    2
    pageConfig: PageConfig
    header:     TipTapDoc
    body:       TipTapDoc
    footer:     TipTapDoc
}

export interface Report {
    id:          number
    collegeId:   number | null
    name:        string
    code:        string
    description: string | null
    structure:   string          // JSON de ReportStructure
    initData:    string | null
    urlPreview:  string | null
    fontsConfig: string | null
    isTemplate:  boolean
    templateId:  number | null
    status:      boolean
    daos?:       ReportDao[]
    createdAt:   string
    updatedAt:   string
}

export const DEFAULT_PAGE_CONFIG: PageConfig = {
    size:          'Letter',
    orientation:   'portrait',
    margins:       { top: 25, right: 20, bottom: 25, left: 20 },
    background:    '#ffffff',
    headerHeight:  15,
    footerHeight:  15,
}

export const EMPTY_STRUCTURE: ReportStructure = {
    version:    2,
    pageConfig: { ...DEFAULT_PAGE_CONFIG, margins: { ...DEFAULT_PAGE_CONFIG.margins } },
    header:     { type: 'doc', content: [] },
    body:       { type: 'doc', content: [] },
    footer:     { type: 'doc', content: [] },
}

export const PAGE_SIZES: Record<string, { width: number; height: number; label: string }> = {
    A4:     { width: 210,   height: 297,   label: 'A4  (210×297 mm)' },
    Letter: { width: 215.9, height: 279.4, label: 'Carta (216×279 mm)' },
    Legal:  { width: 215.9, height: 355.6, label: 'Oficio (216×356 mm)' },
}

/** Parsea el campo structure del backend — soporta formato viejo (TipTapDoc directo) y nuevo (ReportStructure v2) */
export function parseStructure(raw: string): ReportStructure {
    try {
        const parsed = JSON.parse(raw)
        if (parsed?.version === 2) return parsed as ReportStructure
        // Formato anterior: era un TipTapDoc directo → lo migramos al cuerpo
        return { ...EMPTY_STRUCTURE, body: parsed }
    } catch {
        return { ...EMPTY_STRUCTURE }
    }
}
