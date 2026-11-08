"use client";

import { AmbientCanvas } from "@/components/canvas/AmbientCanvas";
import { Topbar } from "@/components/layout/Topbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { useInitialHash } from "@/hooks/useInitialHash";

/**
 * Ensamblador principal del portafolio (SPA con SSG).
 *
 * Orden de capas:
 * 1. `AmbientCanvas` — fondo cinematográfico adaptativo (Tier 1/2) o
 *    gradido estático (Tier 3).
 * 2. `Topbar` — navegación fija con sección activa sincronizada.
 * 3. Secciones de contenido — Hero → Sobre Mí → Habilidades → Proyectos
 *    → Contacto, todas ancladas para el scroll suave.
 * 4. `Footer` — enlaces rápidos y redes.
 *
 * Ajuste 17: `useInitialHash()` sincroniza el scroll si la página
 * se carga directamente con un hash (ej. `/#proyectos`).
 */
export default function Home() {
  useInitialHash();

  return (
    <>
      <AmbientCanvas />
      <div className="grid-overlay pointer-events-none fixed inset-0 -z-10" aria-hidden />

      <Topbar />

      <main id="contenido" className="flex-1">
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <ContactSection />
      </main>

      <Footer />
    </>
  );
}
