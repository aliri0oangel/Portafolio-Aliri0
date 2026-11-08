/**
 * Utilidades de sanitización de strings para mitigar inyecciones
 * (XSS reflejado en la bandeja de entrada, header injection en correo).
 */

/**
 * Escapa las entidades HTML críticas (`&`, `<`, `>`, `"`, `'`) de un texto
 * libre antes de inyectarlo en el cuerpo de un correo o en el DOM.
 *
 * Nota: los inputs ya están validados y acotados con Zod; esta capa es
 * defensa en profundidad, no sustituto de la validación.
 *
 * @param value - Texto crudo proveniente del formulario.
 * @returns Texto con entidades HTML escapadas.
 */
export function escapeHtmlEntities(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Detecta secuencias típicas de header injection (saltos de línea en
 * campos que terminan en cabeceras SMTP).
 *
 * @param value - Campo a inspeccionar.
 * @returns `true` si contiene CR/LF.
 */
export function containsHeaderInjection(value: string): boolean {
  return /[\r\n]/.test(value);
}
