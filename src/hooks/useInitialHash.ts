"use client";

import { useEffect } from "react";
import { revealTargetCards } from "@/lib/sectionNav";

/**
 * Hook para sincronizar el aterrizaje inicial de navegación cuando el usuario
 * entra al sitio con un ancla en la URL (ej. `/#proyectos` o `/#contacto`).
 *
 * Diagnóstico del problema (Ajuste 17):
 * En la carga inicial, el navegador intenta aplicar el hash inmediatamente
 * (~150 ms) mientras el layout superior aún no ha completado el revelado
 * de tarjetas (`.reveal-card-grid`). Al revelarse progresivamente dichas
 * tarjetas (IntersectionObserver del Ajuste 8), el documento crece (~412 px)
 * y el scroll queda desplazado, haciendo que la vista caiga en una sección
 * previa (ej. caer en Habilidades al solicitar Proyectos).
 *
 * Solución:
 * Tras estabilizar el layout con un doble `requestAnimationFrame`, revela
 * preventivamente las tarjetas de la sección destino con `revealTargetCards(sección)`
 * y ejecuta `scrollIntoView({ behavior: "auto", block: "start" })` hacia su
 * `data-nav-anchor` (o a la sección directamente como fallback).
 *
 * El hash en la URL se mantiene intacto sin invocar `replaceState`.
 */
export function useInitialHash(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawHash = window.location.hash;
    if (!rawHash) return;

    const id = rawHash.replace(/^#/, "");
    if (!id) return;

    const section = document.getElementById(id);
    if (!section) return;

    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        revealTargetCards(section);
        const anchor =
          section.querySelector<HTMLElement>("[data-nav-anchor]") ?? section;
        anchor.scrollIntoView({ behavior: "auto", block: "start" });
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
    };
  }, []);
}
