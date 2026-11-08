/**
 * Constantes globales de identidad y navegación del portafolio.
 */

/** Nombre de marca mostrado en el Topbar. */
export const siteName = "alirio.dev";

/** URL canónica del sitio (fallback local si falta la variable de entorno). */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Zona horaria del propietario (UTC-4, Venezuela). */
export const timeZone = "America/Caracas";

/** Etiqueta corta de zona horaria mostrada en badges. */
export const timeZoneLabel = "UTC-4";

/**
 * Entradas de navegación del Topbar. Sin numeración — el estilo
 * "eyebrow + H2" del refactor elimina los prefijos mono `01.`.
 */
export const navLinks = [
  { id: "inicio", label: "Inicio" },
  { id: "sobre-mi", label: "Sobre Mí" },
  { id: "habilidades", label: "Habilidades" },
  { id: "proyectos", label: "Proyectos" },
  { id: "contacto", label: "Contacto" },
] as const;

/** Ruta del CV descargable (archivo estático en /public/cv). */
export const cvPath = "/cv/alirio-cv.pdf";
