"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { projects } from "@/data/projects";
import { cn } from "@/lib/utils";
import { TechBadge } from "@/components/ui/TechBadge";
import { TechIcon } from "@/components/ui/TechIcon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WebGLMorphCanvas } from "@/components/ui/WebGLMorphCanvas";

/** Intervalo para el avance automático en milisegundos (4 s). */
const AUTOPLAY_DELAY_MS = 4000;

/** Referencia estable a las imágenes del catálogo para evitar recreación de texturas WebGL. */
const PROJECT_IMAGES = projects.map((p) => p.featuredImage);

export function ProjectsSection() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const pointerStartX = useRef<number | null>(null);

  const hasProjects = projects.length > 0;
  const activeProject = projects[selectedIndex] ?? projects[0];

  const goTo = useCallback(
    (index: number, dir?: number) => {
      if (!hasProjects) return;
      const total = projects.length;
      // Loop infinito matemático
      const nextIndex = (index + total) % total;
      const calculatedDir = dir ?? (nextIndex > selectedIndex ? 1 : -1);
      setDirection(calculatedDir);
      setSelectedIndex(nextIndex);
    },
    [hasProjects, selectedIndex],
  );

  const handlePrev = useCallback(() => {
    goTo(selectedIndex - 1, -1);
  }, [goTo, selectedIndex]);

  const handleNext = useCallback(() => {
    goTo(selectedIndex + 1, 1);
  }, [goTo, selectedIndex]);

  // Autoplay con loop infinito y respeto a prefers-reduced-motion
  useEffect(() => {
    if (!hasProjects || isPaused) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = setInterval(() => {
      handleNext();
    }, AUTOPLAY_DELAY_MS);

    return () => clearInterval(timer);
  }, [hasProjects, isPaused, handleNext]);

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
  };

  // Navegación por gestos Swipe táctil / ratón
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const deltaX = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  return (
    <section id="proyectos" className="section-contain py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Proyectos"
          title="Casos de estudio seleccionados."
          className="mb-6 md:mb-8"
        />

        {hasProjects ? (
          // Ajuste 13: el stage se acota a max-w-5xl (1024px) y se centra
          // para dejar de verse estirado; los handlers de pausa viven aquí
          // para que la zona de hover coincida exactamente con la foto.
          <div
            className="relative mx-auto w-full max-w-5xl"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* ========================================================= */}
            {/* ESCENARIO CINEMÁTICO BENTO: WEBGL SHADER MORPH (ALT 1)   */}
            {/* ========================================================= */}
            <div
              className={cn(
                "group relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/9]",
                // Ajuste 13: clamp de altura = min(<valor>, 100svh − 14rem)
                // (14rem = 224px: scroll-padding 88 + header 64 + gap 32 +
                // margen inferior 40). Garantiza que el aterrizaje del nav
                // nunca corte el footer en pantallas cortas; en pantallas
                // ≥ ~750px de alto el min() devuelve el valor actual y
                // nada cambia.
                "min-h-[min(380px,calc(100svh_-_14rem))] sm:min-h-[min(460px,calc(100svh_-_14rem))] md:min-h-[min(520px,calc(100svh_-_14rem))] max-h-[min(620px,calc(100svh_-_14rem))]",
                "overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-2xl select-none outline-none",
                "focus-visible:ring-2 focus-visible:ring-accent-emerald",
              )}
              role="region"
              aria-roledescription="carrusel"
              aria-label="Escenario de proyectos"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
            >
              {/* Lienzo WebGL con shader Melt (FBM Noise + aberración cromática) */}
              <WebGLMorphCanvas
                images={PROJECT_IMAGES}
                activeIndex={selectedIndex}
                direction={direction}
                transition="melt"
                intensity={0.55}
                aberration={0.35}
                drift={0.4}
                duration={1.0}
                altText={`Vista previa de ${activeProject.title}`}
                className="w-full h-full block cursor-grab active:cursor-grabbing"
              />

              {/* HUD Superior: Contador de proyectos */}
              <div className="pointer-events-none absolute top-4 left-4 right-4 z-20 flex items-center justify-between sm:top-5 sm:left-6 sm:right-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-1/85 px-3.5 py-1.5 font-mono text-xs text-text-bright backdrop-blur-md shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-accent-emerald-bright animate-pulse" />
                  <span>
                    PROYECTO {String(selectedIndex + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
                  </span>
                </div>
              </div>

              {/* ========================================================= */}
              {/* FOOTER DEL STAGE (Ajuste 13): compacto en 2 filas —       */}
              {/* Fila 1: título + Ver demo · Fila 2: badges + dots        */}
              {/* ========================================================= */}
              <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 sm:inset-x-6 sm:bottom-5">
                {/* Opción A (flotante centrada, máx 672px = max-w-2xl) en
                    versión compacta: py-2.5/sm:py-3 y título hasta text-2xl
                    reducen el tapado de la foto de ~26% a ~16%. El
                    aria-live vive en la card (la región viva es el
                    contenido visible que cambia con cada proyecto). */}
                <div
                  className="pointer-events-auto mx-auto max-w-2xl rounded-2xl border border-border/80 bg-surface-1/90 px-4 py-2.5 backdrop-blur-md shadow-2xl transition-all sm:px-5 sm:py-3"
                  aria-live="polite"
                >
                  {/* Fila 1: título a la izquierda, Ver demo a la derecha */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 text-lg sm:text-2xl font-bold text-text-bright leading-tight tracking-tight">
                      {activeProject.title}
                    </h3>

                    {/* Botón Ver Demo en la esquina superior derecha (si cuenta con URL) */}
                    {activeProject.liveUrl ? (
                      <a
                        href={activeProject.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex shrink-0 items-center gap-2 rounded-xl bg-btn-primary px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold text-btn-primary-fg shadow-lg",
                          "transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-emerald",
                        )}
                      >
                        <span>Ver demo</span>
                        <ArrowUpRight aria-hidden className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>

                  {/* Fila 2: badges de tecnologías (izquierda) + puntos de
                      navegación (derecha) compartiendo una sola línea */}
                  <div className="mt-1.5 flex items-center justify-between gap-3 sm:mt-2">
                    {/* Badges de tecnologías con iconos */}
                    <ul className="flex flex-wrap gap-1.5">
                      {activeProject.technologies.map((tech) => (
                        <li key={tech}>
                          <TechBadge label={tech} icon={<TechIcon name={tech} />} />
                        </li>
                      ))}
                    </ul>

                    {/* Puntos de navegación dentro del footer (Ajuste 12) */}
                    <div
                      className="pointer-events-auto flex shrink-0 items-center justify-center gap-1.5"
                      aria-label="Puntos de navegación de proyectos"
                    >
                      {projects.map((project, index) => {
                        const isSelected = selectedIndex === index;
                        return (
                          <button
                            key={project.id}
                            type="button"
                            aria-label={`Ir al proyecto ${index + 1}: ${project.title}`}
                            aria-current={isSelected ? "true" : undefined}
                            onClick={() => goTo(index)}
                            className={cn(
                              "group/dot -m-1.5 flex h-6 w-6 items-center justify-center rounded-full transition-transform cursor-pointer",
                              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-emerald",
                            )}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "rounded-full transition-all duration-300",
                                isSelected
                                  ? "h-2 w-7 bg-accent-emerald-bright shadow-sm shadow-accent-emerald-bright/50"
                                  : "h-2 w-2 bg-border-strong group-hover/dot:bg-text-faint",
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flechas de navegación: flotan sobre la foto a los lados, centradas en el eje horizontal */}
              <button
                type="button"
                aria-label="Proyecto anterior"
                onClick={handlePrev}
                className="pointer-events-auto absolute left-3 top-1/2 z-30 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-surface-1/90 text-text-bright backdrop-blur-md shadow-xl transition-all hover:scale-105 hover:border-border-strong active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-emerald cursor-pointer sm:left-5 sm:h-12 sm:w-12"
              >
                <ChevronLeft aria-hidden className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Proyecto siguiente"
                onClick={handleNext}
                className="pointer-events-auto absolute right-3 top-1/2 z-30 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-surface-1/90 text-text-bright backdrop-blur-md shadow-xl transition-all hover:scale-105 hover:border-border-strong active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-emerald cursor-pointer sm:right-5 sm:h-12 sm:w-12"
              >
                <ChevronRight aria-hidden className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-surface-1 p-8 text-center text-sm text-text-dim">
            No hay proyectos publicados todavía.
          </p>
        )}
      </div>
    </section>
  );
}
