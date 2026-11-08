"use client";

import { useCallback, useRef } from "react";

/**
 * Hook de reveal para grids de tarjetas (Ajuste 8).
 *
 * Añade la clase `is-visible` al elemento referenciado cuando este
 * entra en el viewport (IntersectionObserver, `once`): el CSS
 * `.reveal-card-grid.is-visible .reveal-card` muestra las tarjetas
 * con `@starting-style` (aparición escalonada por `--i`).
 *
 * Patrón sin `setState` en effects (regla del proyecto): se muta el
 * DOM directamente (classList), no hay re-render. El observer se
 * desconecta tras el primer cruce visible.
 *
 * @returns Ref para colocar en el contenedor `.reveal-card-grid`.
 */
export function useRevealOnScroll<T extends HTMLElement>() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((node: T | null) => {
    // Limpia el observer anterior (nodo desmontado/re-seteado).
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) return;

    // Sin IntersectionObserver (entornos extremos): revela ya.
    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add("is-visible");
            observer.disconnect();
            observerRef.current = null;
          }
        }
      },
      // Umbral bajo: revela al primer píxel visible del grid.
      { threshold: 0.1 },
    );

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return ref;
}
