"use client";

import { useCallback, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { navLinks } from "@/data/site";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/utils";
import { navigateToSection } from "@/lib/sectionNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { MobileNav } from "@/components/layout/MobileNav";

/** IDs de secciones observadas por el IntersectionObserver. */
const SECTION_IDS = navLinks.map((link) => link.id);

/**
 * Barra de navegación global fija con identidad "CodeCraft UI".
 *
 * Sólida por defecto y con glassmorphism al hacer scroll (Iteración
 * 6): fondo opaco al tope, cristal translúcido al desplazarse. El
 * blur se aplica en todos los tiers — solo cubre la barra de 64px y
 * únicamente mientras la página se desplaza (coste GPU mínimo).
 *
 * La sección activa se sincroniza con el scroll mediante
 * `useActiveSection` (IntersectionObserver, sin listeners de scroll).
 * El estado de scroll usa `useScrolled` (listener passive + cache).
 */
export function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolled();

  // useMemo evita recrear el array en cada render (estabilidad del efecto).
  const sectionIds = useMemo(() => SECTION_IDS, []);
  const activeSection = useActiveSection(sectionIds);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  /**
   * Navegación limpia a secciones: delega en `navigateToSection`
   * (Ajuste 8), que scrollea al `data-nav-anchor` (el eyebrow del
   * SectionHeader) en vez del borde del `<section>`, evitando el
   * hueco del padding interno. "Inicio" vuelve al tope. Con soporte
   * usa View Transitions (tipo `section-nav`, crossfade ~300ms con
   * scroll instantáneo); sin soporte o con prefers-reduced-motion
   * cae al scroll clásico (smooth/auto) — mismo comportamiento
   * previo. El hash se actualiza con `replaceState` (URL
   * compartible sin historial basura).
   */
  const handleNavigate = useCallback((id: string) => {
    navigateToSection(id);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-30 border-b transition-colors duration-200",
          scrolled
            ? "border-border/70 bg-bg/70 backdrop-blur-md"
            : "border-border bg-bg",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Identidad de marca con micro-LED esmeralda */}
          <a
            href="#inicio"
            onClick={(event) => {
              event.preventDefault();
              handleNavigate("inicio");
            }}
            className="flex items-center gap-2 text-sm font-semibold text-text-bright"
          >
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-emerald opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-emerald-bright" />
            </span>
            alirio.dev
          </a>

          {/* Navegación principal (desktop) */}
          <nav aria-label="Navegación principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      aria-current={isActive ? "true" : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        handleNavigate(link.id);
                      }}
                      className={cn(
                        "relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive ? "text-text-bright" : "text-text-dim hover:text-text-bright",
                      )}
                    >
                      {link.label}
                      {isActive ? (
                        // Ajuste 8: sin framer-motion — el subrayado del
                        // enlace activo es un span estático (el muelle
                        // layoutId se eliminó junto con el resto de
                        // motion en el chrome de navegación).
                        <span
                          className="absolute inset-x-2 -bottom-px h-px bg-accent-emerald"
                          aria-hidden
                        />
                      ) : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Acciones rápidas */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú de navegación"
              aria-expanded={menuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-1 text-text-dim md:hidden"
            >
              <Menu aria-hidden className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav
        open={menuOpen}
        onClose={closeMenu}
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />
    </>
  );
}
