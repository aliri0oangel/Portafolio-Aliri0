import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import {
  TypewriterTitle,
  TYPEWRITER_PHRASES,
  PAUSE_MS,
  DELETE_MS,
  TYPE_MS,
} from "../TypewriterTitle";

/**
 * Tests del título animado del Hero (Iteración 6).
 *
 * Máquina de estados: escribe → pausa → borra → siguiente frase →
 * loop. Implementada con `useSyncExternalStore` + timers, por lo que
 * se controla con `vi.useFakeTimers`.
 */
describe("TypewriterTitle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  function animatedSpan(container: HTMLElement): Element | null {
    return container.querySelector("h1 [aria-hidden]");
  }

  it("arranca con la primera frase completa", () => {
    const { container } = render(<TypewriterTitle />);
    expect(animatedSpan(container)).toHaveTextContent("Código limpio.");
    expect(animatedSpan(container)).not.toHaveTextContent("Experiencias");
  });

  it("borra y escribe 'Experiencias fluidas.' tras la pausa", () => {
    const { container } = render(<TypewriterTitle />);

    // Pausa + borrado completo de "Código limpio."; +1ms porque
    // advanceTimersByTime no dispara timers justo en el borde.
    const firstLen = TYPEWRITER_PHRASES[0].length;
    const secondLen = TYPEWRITER_PHRASES[1].length;
    act(() => {
      vi.advanceTimersByTime(PAUSE_MS + firstLen * DELETE_MS + 1);
    });
    expect(animatedSpan(container)).not.toHaveTextContent("Código limpio.");

    // Escritura completa de "Experiencias fluidas."
    act(() => {
      vi.advanceTimersByTime(secondLen * TYPE_MS + 1);
    });
    expect(animatedSpan(container)).toHaveTextContent("Experiencias fluidas.");
  });

  it("recorre las 3 frases y vuelve a la primera (loop)", () => {
    const { container } = render(<TypewriterTitle />);

    // Ciclo completo derivado de las constantes (no hardcodeado):
    // 3 pausas + (borrado total + escritura total) de las 3 frases.
    const total = TYPEWRITER_PHRASES.reduce((sum, p) => sum + p.length, 0);
    const cycle =
      TYPEWRITER_PHRASES.length * PAUSE_MS + total * (DELETE_MS + TYPE_MS);

    // +1ms: advanceTimersByTime no dispara timers justo en el borde.
    act(() => {
      vi.advanceTimersByTime(cycle + 1);
    });
    expect(animatedSpan(container)).toHaveTextContent("Código limpio.");

    // Y el bucle continúa: tras la pausa vuelve a borrar.
    act(() => {
      vi.advanceTimersByTime(PAUSE_MS + DELETE_MS + 1);
    });
    expect(animatedSpan(container)).not.toHaveTextContent("Código limpio.");
  });

  it("el h1 contiene el título completo en sr-only (SEO/a11y)", () => {
    const { container } = render(<TypewriterTitle />);
    const srOnly = container.querySelector("h1 .sr-only");
    expect(srOnly).toHaveTextContent(
      TYPEWRITER_PHRASES.join(" ").replace(/\s+/g, " "),
    );
  });

  it("con prefers-reduced-motion muestra el título estático completo", () => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) => ({
      ...original(query),
      matches: query.includes("prefers-reduced-motion"),
    });

    try {
      const { container } = render(<TypewriterTitle />);
      const fullTitle = TYPEWRITER_PHRASES.join(" ");
      expect(animatedSpan(container)).toHaveTextContent(fullTitle);

      act(() => {
        vi.advanceTimersByTime(30_000);
      });
      expect(animatedSpan(container)).toHaveTextContent(fullTitle);
    } finally {
      window.matchMedia = original;
    }
  });
});
