/**
 * Tipado estricto del dominio de proyectos del portafolio.
 * Modelo simplificado para el carrusel de proyectos (Data-as-Code).
 */

/**
 * Contrato de un caso de estudio / proyecto en el portafolio.
 */
export interface IProject {
  /** Identificador único para React keys y anclas (ej: "codecraft-platform"). */
  id: string;
  /** Título del proyecto visible sobre la tarjeta. */
  title: string;
  /** Ruta a la imagen de portada en `/public/projects/`. */
  featuredImage: string;
  /** Lista de tecnologías utilizadas mostradas como badges. */
  technologies: string[];
  /** URL opcional al sitio o demo en producción (activa el botón "Ver demo ↗"). */
  liveUrl?: string;
}
