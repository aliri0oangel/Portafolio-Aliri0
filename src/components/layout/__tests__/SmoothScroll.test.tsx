import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { SmoothScroll } from "../SmoothScroll";

/**
 * Estado compartido del mock de Lenis (hoisted para que el factory
 * de `vi.mock` — elevado arriba de los imports — pueda leerlo).
 */
const lenisState = vi.hoisted(() => ({
  /** Opciones recibidas por el constructor (`null` si no se creó). */
  options: null as Record<string, unknown> | null,
  /** Instancias creadas durante el test. */
  instances: 0,
  raf: vi.fn(),
  destroy: vi.fn(),
}));

/**
 * Mock de Lenis: captura las opciones del constructor para poder
 * verificar la configuración del smooth scroll sin tocar el DOM real.
 */
vi.mock("lenis", () => ({
  default: class LenisMock {
    constructor(options: Record<string, unknown>) {
      lenisState.options = options;
      lenisState.instances += 1;
    }

    raf(time: number) {
      lenisState.raf(time);
    }

    destroy() {
      lenisState.destroy();
    }
  },
}));

/**
 * Tests del proveedor de Smooth Scroll (Ajuste 9).
 *
 * Regresión: el `ResizeObserver` de Lenis observa
 * `document.documentElement`, cuyo border-box no cambia cuando el
 * documento crece (propagación de `body { overflow-x: hidden }`), así
 * que el `limit` quedaba congelado y la rueda no llegaba al footer.
 * Apuntar `content` a `document.body` (que sí crece) hace que su
 * autoResize nativo siga el layout.
 */
describe("SmoothScroll", () => {
  const originalMatchMedia = window.matchMedia;
  const originalRaf = globalThis.requestAnimationFrame;
  const originalCancelRaf = globalThis.cancelAnimationFrame;

  beforeEach(() => {
    lenisState.options = null;
    lenisState.instances = 0;
    lenisState.raf.mockReset();
    lenisState.destroy.mockReset();
    // rAF controlado: el bucle de Lenis no debe auto-encadenarse.
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.matchMedia = originalMatchMedia;
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCancelRaf;
  });

  it("instala Lenis con content: document.body para que autoResize siga el crecimiento del documento", () => {
    render(<SmoothScroll />);

    expect(lenisState.instances).toBe(1);
    expect(lenisState.options).not.toBeNull();
    expect(lenisState.options?.content).toBe(document.body);
  });

  it("destruye Lenis al desmontar", () => {
    const { unmount } = render(<SmoothScroll />);
    expect(lenisState.destroy).toHaveBeenCalledTimes(0);

    unmount();
    expect(lenisState.destroy).toHaveBeenCalledTimes(1);
  });

  it("no instala Lenis con prefers-reduced-motion", () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    render(<SmoothScroll />);

    expect(lenisState.instances).toBe(0);
    expect(lenisState.options).toBeNull();
  });
});
