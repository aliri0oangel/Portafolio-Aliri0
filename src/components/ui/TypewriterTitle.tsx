"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * Título animado del Hero con efecto máquina de escribir (Iteración 6).
 *
 * Frases que se escriben carácter a carácter, se pausan completas, se
 * borran y dan paso a la siguiente en bucle infinito:
 * "Código limpio." → "Experiencias fluidas." → "Resultados reales."
 *
 * Implementado como mini-store con `useSyncExternalStore` (patrón
 * sancionado del proyecto, sin `setState` en efectos). El servidor
 * renderiza la primera frase completa: sin flash vacío ni hydration
 * mismatch; los timers arrancan al suscribir el cliente.
 *
 * Accesibilidad/SEO: el `h1` conserva el título completo en un span
 * `sr-only`; la parte animada es `aria-hidden`. Con
 * `prefers-reduced-motion` se desactiva la animación y se muestra el
 * título estático completo.
 */

/** Frases del bucle, en orden. */
export const TYPEWRITER_PHRASES = [
  "Código limpio.",
  "Experiencias fluidas.",
  "Resultados reales.",
] as const;

/** Milisegundos por carácter al escribir. */
export const TYPE_MS = 60;
/** Milisegundos por carácter al borrar. */
export const DELETE_MS = 35;
/** Pausa con la frase completa en pantalla. */
export const PAUSE_MS = 1000;

const FULL_TITLE = TYPEWRITER_PHRASES.join(" ");

type TypewriterPhase = "pausing" | "deleting" | "typing" | "static";

interface TypewriterState {
  text: string;
  phase: TypewriterPhase;
  phraseIndex: number;
}

const INITIAL_STATE: TypewriterState = {
  text: TYPEWRITER_PHRASES[0],
  phase: "pausing",
  phraseIndex: 0,
};

const STATIC_STATE: TypewriterState = {
  text: FULL_TITLE,
  phase: "static",
  phraseIndex: 0,
};

const listeners = new Set<() => void>();

/** Estado cacheado: `useSyncExternalStore` exige identidad estable. */
let state: TypewriterState = INITIAL_STATE;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

/** Avanza la máquina de estados y programa el siguiente paso. */
function step(): void {
  if (state.phase === "pausing") {
    state = { ...state, phase: "deleting" };
    timeoutId = setTimeout(step, DELETE_MS);
    return;
  }

  if (state.phase === "deleting") {
    const next = state.text.slice(0, -1);
    if (next.length === 0) {
      state = {
        text: "",
        phase: "typing",
        phraseIndex: (state.phraseIndex + 1) % TYPEWRITER_PHRASES.length,
      };
      timeoutId = setTimeout(step, TYPE_MS);
    } else {
      state = { ...state, text: next };
      timeoutId = setTimeout(step, DELETE_MS);
    }
    notifyListeners();
    return;
  }

  // typing
  const target = TYPEWRITER_PHRASES[state.phraseIndex];
  const next = target.slice(0, state.text.length + 1);
  const done = next.length === target.length;
  state = { text: next, phase: done ? "pausing" : "typing", phraseIndex: state.phraseIndex };
  timeoutId = setTimeout(step, done ? PAUSE_MS : TYPE_MS);
  notifyListeners();
}

function getSnapshot(): string {
  return state.text;
}

function getServerSnapshot(): string {
  return INITIAL_STATE.text;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (listeners.size === 1) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    state = reduced ? STATIC_STATE : INITIAL_STATE;

    if (!reduced) timeoutId = setTimeout(step, PAUSE_MS);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (timeoutId !== null) clearTimeout(timeoutId);
      timeoutId = null;
      state = INITIAL_STATE;
    }
  };
}

/**
 * Título `h1` animado con efecto máquina de escribir en bucle.
 *
 * @param className - Clases CSS adicionales para el `h1`.
 */
export function TypewriterTitle({ className }: { className?: string }) {
  const text = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <h1
      className={cn(
        "text-balance text-4xl font-bold leading-tight tracking-tight text-text-bright",
        "min-h-[2.5em] sm:text-5xl sm:min-h-[1.25em]",
        className,
      )}
    >
      <span className="sr-only">{FULL_TITLE}</span>
      <span aria-hidden="true">
        {text}
        <span className="text-accent-emerald-bright animate-pulse">▍</span>
      </span>
    </h1>
  );
}
