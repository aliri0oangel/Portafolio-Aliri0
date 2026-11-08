import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases condicionales (clsx) con deduplicación inteligente de
 * utilidades de Tailwind (tailwind-merge). Única fuente de verdad para
 * el `className` de los componentes polimórficos.
 *
 * @param inputs - Lista de clases, objetos condicionales o falsy values.
 * @returns Cadena de clases optimizada y sin conflictos.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
