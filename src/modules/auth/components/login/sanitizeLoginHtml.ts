import DOMPurify from 'dompurify'

/**
 * Sanitizador específico para el HTML personalizado del login.
 *
 * A diferencia de `sanitizeHtml` (que prohíbe `style` por completo), aquí SÍ
 * permitimos estilos en línea, clases e imágenes para que el administrador pueda
 * maquetar libremente la pantalla — pero seguimos eliminando cualquier vector de
 * ejecución de código: <script>, <iframe>, <object>, <embed>, <form> real,
 * manejadores on* y URLs javascript:.
 *
 * El formulario de credenciales NUNCA se inyecta como HTML: se marca con
 * `[data-login-form]` y el componente Vue lo teletransporta ahí, por lo que la
 * captura de usuario/contraseña siempre es código Vue confiable.
 */
export function sanitizeLoginHtml(dirty: string): string {
    if (!dirty) return ''
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [
            'div', 'span', 'section', 'header', 'footer', 'main', 'aside', 'nav', 'article',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'strong', 'em', 'small', 'b', 'i', 'u',
            'ul', 'ol', 'li', 'br', 'hr', 'img', 'figure', 'figcaption', 'picture', 'source',
            'svg', 'path', 'g', 'circle', 'rect', 'line', 'polyline', 'polygon', 'style',
        ],
        ALLOWED_ATTR: [
            'class', 'style', 'id', 'src', 'srcset', 'alt', 'title', 'href', 'target', 'rel',
            'width', 'height', 'data-login-form', 'aria-hidden', 'role',
            // SVG
            'viewBox', 'fill', 'stroke', 'stroke-width', 'd', 'cx', 'cy', 'r', 'x', 'y',
            'x1', 'y1', 'x2', 'y2', 'points', 'transform', 'preserveAspectRatio',
        ],
        // Solo esquemas seguros para href/src (bloquea javascript:)
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'link', 'meta', 'base'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onsubmit'],
        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['data-login-form'],
    })
}
