"use client";

import { useSyncExternalStore } from "react";

/**
 * Hook de estado de scroll (Iteración 6).
 *
 * Mini-store con `useSyncExternalStore` — patrón sancionado del
 * proyecto (igual que `useDeviceTier`/`LocalClock`): el listener
 * `scroll` vive fuera de React y solo notifica cuando el booleano
 * cacheado cambia, sin `setState` en efectos.
 *
 * El servidor asume `false` (arriba de todo); tras la hidratación
 * React recalibra con la posición real sin hydration mismatch.
 */

/** Desplazamiento mínimo (px) para considerar que se hizo scroll. */
export const SCROLL_THRESHOLD = 8;

const listeners = new Set<() => void>();

/** Snapshot cacheado: `useSyncExternalStore` exige identidad estable. */
let cachedScrolled: boolean | null = null;

function computeScrolled(): boolean {
  return window.scrollY > SCROLL_THRESHOLD;
}

function getSnapshot(): boolean {
  if (cachedScrolled === null) cachedScrolled = computeScrolled();
  return cachedScrolled;
}

function getServerSnapshot(): boolean {
  return false;
}

function handleScroll(): void {
  const next = computeScrolled();
  if (next === cachedScrolled) return;
  cachedScrolled = next;
  for (const listener of listeners) listener();
}

/**
 * Indica si la página se ha desplazado más allá del umbral (8px).
 *
 * @returns `true` cuando `scrollY` supera el umbral.
 */
export function useScrolled(): boolean {
  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    if (listeners.size === 1) {
      // Invalida el cache al adjuntar: un mount posterior parte del
      // scrollY real (p. ej. recarga con la posición restaurada).
      cachedScrolled = null;
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        window.removeEventListener("scroll", handleScroll);
        cachedScrolled = null;
      }
    };
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
