const LABELS: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviado',
    in_review: 'En revisión',
    approved: 'Aprobado',
    applied: 'Aplicado',
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
}

const CLASSES: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    sent: 'bg-blue-100 text-blue-700',
    in_review: 'bg-amber-100 text-amber-700',
    approved: 'bg-indigo-100 text-indigo-700',
    applied: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    cancelled: 'bg-slate-200 text-slate-500',
}

export function statusLabel(status: string): string {
    return LABELS[status] ?? status
}

export function statusClass(status: string): string {
    return CLASSES[status] ?? 'bg-slate-100 text-slate-600'
}
