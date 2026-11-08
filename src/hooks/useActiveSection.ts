"use client";

import { useEffect, useState } from "react";

/** Margen de observación del IntersectionObserver (50% de la sección). */
const OBSERVER_ROOT_MARGIN = "-40% 0px -50% 0px";

/**
 * Sincroniza el enlace de navegación activo con la sección visible en el
 * scroll usando `IntersectionObserver` (sin listeners de scroll, cero
 * coste de main thread en cada frame).
 *
 * @param sectionIds - IDs de las secciones del documento a observar.
 * @returns ID de la sección actualmente visible.
 */
export function useActiveSection(sectionIds: readonly string[]): string {
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (!element) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: OBSERVER_ROOT_MARGIN },
      );

      observer.observe(element);
      observers.push(observer);
    }

    // Limpieza rigurosa: sin Observers huérfanos ni fugas de memoria.
    return () => {
      for (const observer of observers) observer.disconnect();
    };
  }, [sectionIds]);

  return activeSection;
}
