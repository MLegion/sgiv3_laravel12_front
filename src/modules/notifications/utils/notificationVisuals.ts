import type { Component } from 'vue'
import {
    BellAlertIcon,
    AcademicCapIcon,
    CalendarIcon,
    ClipboardDocumentCheckIcon,
    UserGroupIcon,
} from '@heroicons/vue/24/outline'

/**
 * Mapa de visuals por módulo (derivado del prefijo del event_key, e.g.
 * "admissions.applicant_registered" → "admissions").
 *
 * Se usa tanto en el dropdown del bell como en el toast emergente para que
 * el usuario reconozca de qué viene la notificación sin leer el subject.
 */

function moduleOf(eventKey: string | null | undefined): string {
    return (eventKey ?? '').split('.', 1)[0] ?? ''
}

export function iconForEvent(eventKey: string | null | undefined): Component {
    switch (moduleOf(eventKey)) {
        case 'admissions':       return ClipboardDocumentCheckIcon
        case 'school-services':
        case 'graduation':       return AcademicCapIcon
        case 'advising':         return UserGroupIcon
        case 'sca':              return CalendarIcon
        default:                 return BellAlertIcon
    }
}

export function iconClassForEvent(eventKey: string | null | undefined): string {
    switch (moduleOf(eventKey)) {
        case 'admissions':       return 'bg-blue-100 text-blue-700'
        case 'school-services':
        case 'graduation':       return 'bg-emerald-100 text-emerald-700'
        case 'advising':         return 'bg-violet-100 text-violet-700'
        case 'sca':              return 'bg-amber-100 text-amber-700'
        default:                 return 'bg-indigo-100 text-indigo-700'
    }
}

export function moduleLabelForEvent(eventKey: string | null | undefined): string {
    const map: Record<string, string> = {
        'admissions':       'Admisiones',
        'school-services':  'Servicios escolares',
        'graduation':       'Titulación',
        'advising':         'Asesoría',
        'sca':              'Carga académica',
    }
    return map[moduleOf(eventKey)] ?? 'Notificación'
}
