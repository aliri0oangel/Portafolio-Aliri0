/**
 * Tipado de los payloads de la API de contacto.
 */

/**
 * Payload entrante del formulario. El campo `website` es el honeypot
 * silencioso: los bots lo rellenan y el servidor lo descarta.
 */
export interface IContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}

/**
 * Respuesta estándar del endpoint `/api/contact`.
 */
export type ContactResponse =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };
