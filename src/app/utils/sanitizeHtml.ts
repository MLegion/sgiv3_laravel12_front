import DOMPurify from 'dompurify'

/**
 * Sanitiza HTML antes de inyectarlo con `v-html`. Defensa en profundidad contra
 * XSS almacenado: aunque el backend ya escapa los valores de plantilla, cualquier
 * cuerpo renderizado que provenga de datos (p.ej. body_rendered de una
 * notificación) se limpia aquí de scripts, manejadores de eventos e iframes.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'iframe', 'form', 'object', 'embed', 'script'],
    FORBID_ATTR: ['style', 'srcset'],
  })
}

/**
 * Devuelve solo el texto plano de un fragmento HTML (sin etiquetas). Útil para
 * vistas previas en celdas de tabla donde no se quiere renderizar HTML.
 */
export function stripHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}
