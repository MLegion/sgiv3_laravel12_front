export function statusLabel(s: string): string {
    return ({
        registered: 'Registrado', scheduled: 'Programado', presented: 'Presentado',
        titulado: 'Titulado', dropped: 'Baja',
    } as Record<string, string>)[s] ?? s
}

export function statusClass(s: string): string {
    return ({
        registered: 'bg-slate-200 text-slate-600',
        scheduled:  'bg-blue-100 text-blue-700',
        presented:  'bg-amber-100 text-amber-700',
        titulado:   'bg-emerald-100 text-emerald-700',
        dropped:    'bg-red-100 text-red-600',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-500'
}

export function actStatusLabel(s: string): string {
    return ({ scheduled: 'Programado', done: 'Realizado', cancelled: 'Cancelado' } as Record<string, string>)[s] ?? s
}

export function actStatusClass(s: string): string {
    return ({
        scheduled: 'bg-blue-100 text-blue-700',
        done: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-600',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-500'
}

export function outcomeLabel(o: string | null): string {
    if (!o) return '—'
    return ({ aprobado: 'Aprobado', suspendido: 'Suspendido', aplazado: 'Aplazado' } as Record<string, string>)[o] ?? o
}
