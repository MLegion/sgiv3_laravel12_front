export function statusLabel(s: string): string {
    return ({ draft: 'Borrador', open: 'Abierta', closed: 'Cerrada' } as Record<string, string>)[s] ?? s
}
export function statusClass(s: string): string {
    return ({
        draft: 'bg-slate-200 text-slate-600',
        open: 'bg-emerald-100 text-emerald-700',
        closed: 'bg-slate-300 text-slate-600',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-500'
}
export function invStatusLabel(s: string): string {
    return ({ pending: 'Pendiente', sent: 'Enviada', responded: 'Respondida' } as Record<string, string>)[s] ?? s
}
export function invStatusClass(s: string): string {
    return ({
        pending: 'bg-slate-200 text-slate-600',
        sent: 'bg-blue-100 text-blue-700',
        responded: 'bg-emerald-100 text-emerald-700',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-500'
}
