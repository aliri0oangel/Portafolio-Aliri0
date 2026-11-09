"use client";

import {
  Code2,
  Palette,
  MessageSquareCheck,
  ShoppingBag,
} from "lucide-react";
import { BentoCard } from "@/components/ui/BentoCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

/**
 * Pilares de trabajo mostrados en la sección "Sobre Mí".
 *
 * Cuatro tarjetas de valor con título, icono contextual y descripción,
 * diseñadas con enfoque Bento y cursor-pointer interactivo.
 */
const pillars = [
  {
    icon: Code2,
    title: "Código limpio y escalable",
    description:
      "Escribo arquitectura sólida, legible y mantenible. Desarrollo software preparado para crecer sin deuda técnica, garantizando rapidez y facilidad para futuras actualizaciones.",
  },
  {
    icon: Palette,
    title: "Diseño intuitivo y personalizado",
    description:
      "Transformo ideas en interfaces atractivas, fluidas y centradas en el usuario. Cada detalle visual responde a una necesidad funcional alineada con la identidad de tu marca.",
  },
  {
    icon: MessageSquareCheck,
    title: "Comunicación y confiabilidad",
    description:
      "Trabajo con transparencia, entregas puntuales y avances claros en cada etapa del proyecto. Garantizo un proceso colaborativo, sin sorpresas ni fricciones.",
  },
  {
    icon: ShoppingBag,
    title: "Desarrollo en WordPress + WooCommerce",
    description:
      "Creo sitios web y tiendas en línea a medida, rápidas y seguras. Optimizo la gestión de tu negocio con plataformas auto-administrables y listas para vender.",
  },
] as const;

/**
 * Sección "Sobre Mí": narrativa breve del perfil profesional y los
 * cuatro pilares de ingeniería que gobiernan cada proyecto.
 *
 * Motion (Ajuste 8): el header se revela con scroll-driven animations
 * (clase `.reveal`); los 4 pilares usan `@starting-style` — el grid
 * arranca oculto y `useRevealOnScroll` (IntersectionObserver, once)
 * añade `.is-visible` al entrar en pantalla, revelando cada card con
 * stagger por `--i`.
 */
export function AboutSection() {
  const pillarsRef = useRevealOnScroll<HTMLDivElement>();

  // Espaciado estandarizado según la sección Proyectos:
  // py-10 sm:py-14 para el contenedor de sección y mb-6 md:mb-8 para el encabezado.
  // Esto garantiza consistencia visual y alineación geométrica idéntica en el scroll de la navbar.
  return (
    <section id="sobre-mi" className="section-contain py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Sobre Mí"
          title="Obsesión por el detalle, rigor en el código."
          description="Diseño sistemas escalables desde la arquitectura hasta los detalles de la interfaz. Apuesto por código limpio, backend robusto y cero fricción para el usuario final, permitiendo que el producto evolucione con seguridad."
          className="reveal mb-6 md:mb-8"
        />

        <div
          ref={pillarsRef}
          className="reveal-card-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {pillars.map(({ icon: Icon, title, description }, index) => (
            <BentoCard
              key={title}
              data-testid="about-pillar-card"
              className="reveal-card group flex-col gap-3 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-accent-emerald-bright/50 hover:shadow-lg hover:shadow-emerald-950/20 motion-reduce:hover:translate-y-0"
              style={{ "--i": index } as React.CSSProperties}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-2 text-accent-cyan-bright transition-colors group-hover:border-accent-emerald/40 group-hover:text-accent-emerald-bright">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold text-text-bright transition-colors group-hover:text-accent-emerald-bright">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-text-dim">
                {description}
              </p>
            </BentoCard>
          ))}
        </div>
      </div>
    </section>
  );
}
