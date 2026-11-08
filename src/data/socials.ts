/**
 * Canales de contacto directo del portafolio.
 *
 * PLACEHOLDER: sustituir por los enlaces reales del propietario
 * (usuario de GitHub, perfil de LinkedIn, número WhatsApp en formato E.164).
 */
export const socials = {
  email: "alirioangel44@gmail.com",
  github: "https://github.com/alirio",
  linkedin: "https://www.linkedin.com/in/alirio",
  /** Formato E.164 sin signos: 58 + código de área + número. */
  whatsappNumber: "584123936025",
  whatsappPrefilledMessage:
    "¡Hola Alirio! Vengo de tu portafolio y me gustaría conversar sobre un proyecto.",
} as const;

/**
 * Construye el enlace directo de WhatsApp con mensaje precargado.
 *
 * @param number - Número en formato E.164 sin símbolos.
 * @param message - Mensaje de apertura precargado en el hilo.
 * @returns URL canónica de la API de WhatsApp.
 */
export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** URL final de WhatsApp lista para usar en la UI. */
export const whatsappUrl = buildWhatsAppUrl(
  socials.whatsappNumber,
  socials.whatsappPrefilledMessage,
);
