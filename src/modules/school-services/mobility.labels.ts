// Etiquetas y descripciones claras del tipo de trámite de movilidad (TecNM).
// Combina process_type + scope + direction en algo legible para el usuario.

export interface MobilityKind {
    label: string
    short: string
    desc: string
    cls: string
}

/** Glosario de los procesos TecNM (para la leyenda de ayuda). */
export const PROCESS_GLOSSARY: { key: string; label: string; desc: string; cls: string }[] = [
    { key: 'traslado', label: 'Traslado', desc: 'Movimiento del alumno entre planteles del TecNM (mismo sistema). Dispara convalidación o equivalencia.', cls: 'bg-blue-100 text-blue-700' },
    { key: 'convalidacion', label: 'Convalidación', desc: 'Mismo plan de estudios TecNM: las materias se reconocen directo por clave oficial.', cls: 'bg-teal-100 text-teal-700' },
    { key: 'equivalencia', label: 'Equivalencia', desc: 'Estudios de otra institución del sistema educativo nacional u otro plan. Requiere dictamen.', cls: 'bg-violet-100 text-violet-700' },
    { key: 'revalidacion', label: 'Revalidación', desc: 'Estudios realizados en una institución del extranjero. Requiere resolución (Acuerdo 286).', cls: 'bg-amber-100 text-amber-700' },
]

/** Deriva el tipo de trámite legible de un caso. */
export function mobilityKind(c: any): MobilityKind {
    // Salida hacia una institución externa.
    if (c?.scope === 'external' && c?.direction === 'outbound') {
        return { label: 'Salida por traslado', short: 'Salida', desc: 'El alumno deja este plantel hacia una institución externa (baja + certificado parcial).', cls: 'bg-rose-100 text-rose-700' }
    }
    switch (c?.process_type) {
        case 'revalidacion':
            return { label: 'Revalidación (extranjero)', short: 'Revalidación', desc: 'Reconocimiento de estudios realizados en el extranjero.', cls: 'bg-amber-100 text-amber-700' }
        case 'equivalencia':
            return { label: 'Equivalencia (externa)', short: 'Equivalencia', desc: 'Reconocimiento de estudios de otra IES nacional u otro plan.', cls: 'bg-violet-100 text-violet-700' }
        case 'convalidacion':
            return { label: 'Convalidación', short: 'Convalidación', desc: 'Mismo plan TecNM: reconocimiento directo por clave.', cls: 'bg-teal-100 text-teal-700' }
        case 'traslado':
            return {
                label: c?.scope === 'internal' ? 'Traslado interno' : 'Traslado',
                short: 'Traslado',
                desc: 'Traslado entre planteles del sistema. Convalida las materias con la misma clave; el resto se resuelve por equivalencia.',
                cls: 'bg-blue-100 text-blue-700',
            }
        default:
            return { label: c?.process_type ?? '—', short: c?.process_type ?? '—', desc: '', cls: 'bg-slate-100 text-slate-600' }
    }
}

/** Entrante/saliente relativo al plantel actual (si se conoce su id). */
export function directionLabel(c: any, myCollegeId?: number | null): string | null {
    if (!myCollegeId) return null
    if (c?.destination_college_id === myCollegeId && c?.origin_college_id !== myCollegeId) return 'Entrante'
    if (c?.origin_college_id === myCollegeId && c?.destination_college_id !== myCollegeId) return 'Saliente'
    return null
}
