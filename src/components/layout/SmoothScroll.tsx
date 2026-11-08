"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Componente proveedor de Smooth Scroll cinético con Lenis.
 *
 * Características:
 * - Inercia fluida a 60-120 FPS sincronizada con requestAnimationFrame.
 * - Desactivación automática si el usuario tiene `prefers-reduced-motion`.
 * - Limpieza adecuada (`lenis.destroy()`) al desmontar el componente.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respeto estricto a la accesibilidad del sistema
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    try {
      const lenis = new Lenis({
        // Observa `body`, no `<html>`: su border-box está fijo en el
        // alto del viewport (propagación de `body { overflow-x: hidden }`),
        // así que el ResizeObserver nativo de Lenis nunca ve el
        // crecimiento del documento y su `limit` quedaba congelado en el
        // layout inicial → la rueda no llegaba al footer (Ajuste 9).
        // `body` sí cambia de alto (los reveals lo expanden) y su RO
        // dispara, manteniendo el límite sincronizado automáticamente.
        content: document.body,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.8,
      });

      let animationFrameId: number;

      function raf(time: number) {
        lenis.raf(time);
        animationFrameId = requestAnimationFrame(raf);
      }

      animationFrameId = requestAnimationFrame(raf);

      return () => {
        cancelAnimationFrame(animationFrameId);
        lenis.destroy();
      };
    } catch {
      // Fallback silencioso en entornos que no admiten Lenis (ej. headless / jsdom)
    }
  }, []);

  return null;
}
