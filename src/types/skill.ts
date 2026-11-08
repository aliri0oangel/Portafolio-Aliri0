/**
 * Tipado del dominio de competencias técnicas.
 */

/**
 * Categorías de la matriz de habilidades. La UI renderiza una
 * tarjeta por categoría en una grilla fija de 3 columnas.
 */
export type SkillCategory = "Frontend" | "Backend" | "Complementos";

/**
 * Estados de aprendizaje de una tecnología.
 *
 * `"learning"` renderiza el badge naranja "En proceso" en el tile.
 * Union abierta a propósito (OCP): añadir un nuevo estado futuro
 * (ej. `"certified"`) no requiere cambiar el tipo de `status`.
 */
export type SkillStatus = "learning";

/**
 * Tecnología individual de la matriz de competencias.
 */
export interface ISkill {
  /** Identificador estable (kebab-case, único). */
  id: string;
  /** Nombre visible en la etiqueta del tile. */
  name: string;
  /** Categoría de agrupación en la grilla. */
  category: SkillCategory;
  /** Ruta local del icono SVG auto-hospedado en /public/tech. */
  icon: string;
  /** URL de los docs oficiales; destino del click en el tile. */
  url: string;
  /** Estado de aprendizaje; `"learning"` muestra badge "En proceso". */
  status?: SkillStatus;
}
