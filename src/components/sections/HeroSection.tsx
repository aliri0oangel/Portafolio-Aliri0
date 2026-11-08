"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import { cvPath } from "@/data/site";
import { navigateToSection } from "@/lib/sectionNav";
import { HeroOrbit } from "@/components/sections/HeroOrbit";

/**
 * Sección Hero: comunicación de valor en menos de 5 segundos.
 *
 * Estructura de dos columnas calibrada para encajar en el viewport (100svh):
 * - Izquierda: tres titulares en orden vertical con escala fluida
 *   ("Código limpio.", "Experiencias fluidas." en verde esmeralda semántico,
 *   "Resultados reales."), propuesta de valor y CTAs sin desborde vertical.
 * - Derecha: Sistema orbital interactivo (HeroOrbit) centrado; el widget
 *   LocalClock vive en ContactSection.
 *
 * Animaciones: entrada escalonada (stagger) con Framer Motion; con
 * `prefers-reduced-motion` activo se degradan a opacidad simple.
 */
export function HeroSection() {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } },
  };

  const item = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] as const },
    },
  };

  return (
    <section
      id="inicio"
      className="relative flex min-h-[calc(100svh-4rem)] items-center pt-20 pb-10 sm:pt-24 sm:pb-12 lg:pt-20 lg:pb-12"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 xl:gap-14 lg:px-8">
        {/* Columna 1: Declaración tipográfica de impacto calibrada al viewport */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-start gap-4 sm:gap-5 lg:gap-6"
        >
          <motion.div variants={item}>
            <h1 className="flex flex-col font-mono text-3xl font-extrabold tracking-tight leading-[1.12] sm:text-4xl md:text-5xl lg:text-[2.6rem] xl:text-[3.2rem]">
              <span className="text-text-bright">Código limpio.</span>
              <span className="text-accent-emerald-bright drop-shadow-[0_0_24px_var(--glow-emerald)]">
                Experiencias fluidas.
              </span>
              <span className="text-text-bright">Resultados reales.</span>
            </h1>
          </motion.div>

          <motion.p
            variants={item}
            className="max-w-lg text-pretty text-sm leading-relaxed text-text-dim sm:text-base"
          >
            Desarrollador web Full-Stack enfocado en construir productos web de
            alto rendimiento, escalables y optimizados para el crecimiento de tu
            negocio.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-wrap items-center gap-3 pt-0.5"
          >
            <a
              href="#proyectos"
              onClick={(event) => {
                event.preventDefault();
                navigateToSection("proyectos");
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-btn-primary px-5 py-2.5 text-sm font-semibold text-btn-primary-fg shadow-[0_0_24px_var(--glow-emerald)] transition-all hover:-translate-y-0.5 hover:bg-btn-primary-hover"
            >
              Explorar Proyectos
              <ArrowRight aria-hidden className="h-4 w-4" />
            </a>
            <a
              href={cvPath}
              download
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-strong px-5 py-2.5 text-sm font-semibold text-text-bright transition-colors hover:border-accent-cyan hover:text-accent-cyan-bright"
            >
              <Download aria-hidden className="h-4 w-4" />
              Descargar CV
            </a>
          </motion.div>
        </motion.div>

        {/* Columna 2: Sistema orbital interactivo (el LocalClock se trasladó
            a ContactSection). La entrada elástica escalonada la orquesta el
            propio HeroOrbit (stagger por pieza); el wrapper solo hace fade. */}
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.65,
            delay: 0.15,
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
          className="flex w-full items-center justify-center"
        >
          <HeroOrbit />
        </motion.div>
      </div>
    </section>
  );
}
