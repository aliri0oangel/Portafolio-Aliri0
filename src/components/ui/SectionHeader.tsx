import { cn } from "@/lib/utils";

/**
 * Props del encabezado de sección.
 */
export interface SectionHeaderProps {
  /** Etiqueta corta en mayúsculas con línea decorativa (ej. "Arsenal tech"). */
  eyebrow: string;
  /** Título principal en H2 semántico. */
  title: string;
  /** Párrafo descriptivo opcional bajo el título (se omite en secciones concisas). */
  description?: string;
  /** Clases Tailwind adicionales para composición externa (espaciado). */
  className?: string;
}

/**
 * Encabezado de sección reutilizable estilo "eyebrow + H2 (+ descripción)".
 *
 * Sustituye al patrón numerado `03 // TÍTULO`. La línea decorativa
 * de 32×1px se dibuja con el pseudo-elemento `::before` heredando
 * `currentColor` del span — es decorativa.
 *
 * Accesibilidad: el H2 es el único heading; el eyebrow es un `<span>`
 * para no interferir en la jerarquía de encabezados. El atributo
 * `data-nav-anchor` marca el punto de aterrizaje del scroll de la
 * navbar (el eyebrow queda justo debajo de la barra fija).
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <header
      data-nav-anchor
      className={cn("mb-10 flex flex-col items-start gap-2 md:mb-14", className)}
    >
      <span className="inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-accent-emerald before:h-px before:w-8 before:bg-current before:content-['']">
        {eyebrow}
      </span>
      <h2 className="text-3xl font-bold tracking-tight text-text-bright sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-text-dim">
          {description}
        </p>
      ) : null}
    </header>
  );
}
