"use client";

import { skills } from "@/data/skills";
import type { SkillCategory } from "@/types/skill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { SkillGroupCard } from "./skills/SkillGroupCard";

/**
 * Orden fijo de las 3 categorías en la grilla de habilidades.
 * El tipo `SkillCategory` garantiza exhaustividad en compile-time.
 */
const CATEGORIES: SkillCategory[] = ["Frontend", "Backend", "Complementos"];

/**
 * Sección de competencias técnicas: grilla fija de 3 tarjetas
 * (Frontend / Backend / Complementos) con tiles de iconos.
 *
 * Sin tabs ni filtros — la referencia "Tech Arsenal" muestra todo
 * de una vez.
 *
 * Motion (Ajuste 8): sin framer-motion. El encabezado se revela con
 * scroll-driven animations (clase `.reveal`) y las 3 tarjetas usan
 * `@starting-style` — la grilla arranca oculta y `useRevealOnScroll`
 * (IntersectionObserver, once) añade `.is-visible` al entrar en
 * pantalla, revelando cada card con stagger por `--i`. Con
 * `prefers-reduced-motion` o sin soporte de `@starting-style` las
 * tarjetas quedan visibles (degradación limpia en CSS).
 */
export function SkillsSection() {
  const gridRef = useRevealOnScroll<HTMLDivElement>();

  return (
    <section id="habilidades" className="section-contain py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Arsenal tech"
          title="Herramientas y conocimientos técnicos"
          className="reveal"
        />

        <div
          ref={gridRef}
          className="reveal-card-grid grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {CATEGORIES.map((category, index) => (
            <div
              key={category}
              className="reveal-card h-full flex-col"
              style={{ "--i": index } as React.CSSProperties}
            >
              <SkillGroupCard category={category} skills={skills} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
