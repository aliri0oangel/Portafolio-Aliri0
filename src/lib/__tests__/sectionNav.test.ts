import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { navigateToSection } from "../sectionNav";

/**
 * Tests del helper de navegación de secciones con View Transitions
 * (Ajuste 8 — Fase B).
 *
 * Contrato:
 * - Con soporte (startViewTransition + tipos de VT + sin
 *   prefers-reduced-motion) → `startViewTransition({ update,
 *   types: ["section-nav"] })`; el update scrollea de forma
 *   instantánea y actualiza el hash con replaceState.
 * - Sin startViewTransition (jsdom, browsers viejos) → fallback:
 *   scrollIntoView smooth + hash (comportamiento previo exacto).
 * - Con prefers-reduced-motion → fallback con scroll "auto".
 * - "inicio" → scrollTo(0) en ambos caminos.
 *
 * Nota jsdom: `scrollIntoView` no existe en HTMLElement.prototype
 * (se define aquí con vi.fn); `matchMedia` (setup.ts) es writable
 * pero no configurable → se restaura por assignment, no defineProperty.
 */
describe("navigateToSection", () => {
  /** Crea una sección ficticia con (o sin) data-nav-anchor. */
  function mountSection(id: string, withAnchor = true): HTMLElement {
    const section = document.createElement("section");
    section.id = id;
    if (withAnchor) {
      const anchor = document.createElement("header");
      anchor.setAttribute("data-nav-anchor", "");
      section.appendChild(anchor);
    }
    document.body.appendChild(section);
    return section;
  }

  /** Spy de startViewTransition que captura las opciones. */
  function mockStartViewTransition() {
    const calls: Array<{ update: () => void; types?: string[] }> = [];
    const startViewTransition = vi.fn((options: {
      update: () => void;
      types?: string[];
    }) => {
      calls.push(options);
      options.update();
      return { finished: Promise.resolve() };
    });
    Object.defineProperty(document, "startViewTransition", {
      writable: true,
      configurable: true,
      value: startViewTransition,
    });
    return { startViewTransition, calls };
  }

  /** Simula soporte (o no) de tipos de VT vía CSS.supports. */
  function mockCssSupports(supported: boolean) {
    const supports = vi.fn(() => supported);
    Object.defineProperty(window, "CSS", {
      writable: true,
      configurable: true,
      value: { supports },
    });
    return supports;
  }

  /** Simula prefers-reduced-motion (assignment: matchMedia es writable). */
  function mockReducedMotion(matches: boolean) {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? matches : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }

  let scrollIntoViewMock: ReturnType<typeof vi.fn>;
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(() => {
    scrollIntoViewMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      writable: true,
      configurable: true,
      value: scrollIntoViewMock,
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete (
      HTMLElement.prototype as unknown as Record<string, unknown>
    ).scrollIntoView;
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
      originalMatchMedia = undefined;
    }
    delete (window as unknown as Record<string, unknown>).CSS;
    delete (document as unknown as Record<string, unknown>).startViewTransition;
    vi.restoreAllMocks();
  });

  it("con soporte: llama a startViewTransition con types ['section-nav']", () => {
    mountSection("habilidades");
    mockCssSupports(true);
    mockReducedMotion(false);
    const { startViewTransition, calls } = mockStartViewTransition();

    navigateToSection("habilidades");

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(calls[0].types).toEqual(["section-nav"]);
  });

  it("el update scrollea instantáneamente al anchor y actualiza el hash", () => {
    const section = mountSection("proyectos");
    const anchor = section.querySelector<HTMLElement>("[data-nav-anchor]")!;
    mockCssSupports(true);
    mockReducedMotion(false);
    mockStartViewTransition();

    navigateToSection("proyectos");

    // Dentro del update: scroll instantáneo (sin smooth) al anchor
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    // La llamada a scrollIntoView vino del anchor (this = anchor)
    expect(scrollIntoViewMock.mock.contexts[0]).toBe(anchor);
    // Hash actualizado
    expect(window.location.hash).toBe("#proyectos");
  });

  it("sin startViewTransition: fallback con scrollIntoView smooth + hash", () => {
    const section = mountSection("sobre-mi");
    const anchor = section.querySelector<HTMLElement>("[data-nav-anchor]")!;
    // jsdom no tiene startViewTransition → queda undefined
    mockReducedMotion(false);

    navigateToSection("sobre-mi");

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(scrollIntoViewMock.mock.contexts[0]).toBe(anchor);
    expect(window.location.hash).toBe("#sobre-mi");
  });

  it("sin tipos de VT (CSS.supports false): fallback smooth (no VT)", () => {
    mountSection("contacto");
    mockCssSupports(false);
    mockReducedMotion(false);
    const { startViewTransition } = mockStartViewTransition();

    navigateToSection("contacto");

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("con prefers-reduced-motion: fallback con scroll auto y sin VT", () => {
    mountSection("habilidades");
    mockCssSupports(true);
    mockReducedMotion(true);
    const { startViewTransition } = mockStartViewTransition();

    navigateToSection("habilidades");

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("'inicio': scrollTo(0) instantáneo dentro del update con soporte", () => {
    mockCssSupports(true);
    mockReducedMotion(false);
    const scrollToSpy = vi.fn();
    Object.defineProperty(window, "scrollTo", {
      writable: true,
      configurable: true,
      value: scrollToSpy,
    });
    mockStartViewTransition();

    navigateToSection("inicio");

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    expect(window.location.hash).toBe("#inicio");
  });

  it("'inicio' sin soporte: scrollTo(0) smooth", () => {
    mockReducedMotion(false);
    const scrollToSpy = vi.fn();
    Object.defineProperty(window, "scrollTo", {
      writable: true,
      configurable: true,
      value: scrollToSpy,
    });

    navigateToSection("inicio");

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(window.location.hash).toBe("#inicio");
  });

  it("sección inexistente: sin scroll pero actualiza el hash", () => {
    mockReducedMotion(false);

    navigateToSection("no-existe");

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#no-existe");
  });

  it("sección sin data-nav-anchor: scrollea a la sección (fallback interno)", () => {
    const section = mountSection("habilidades", false);
    mockReducedMotion(false);

    navigateToSection("habilidades");

    expect(scrollIntoViewMock.mock.contexts[0]).toBe(section);
  });

  it("revela las tarjetas del destino (reveal-card-grid) ANTES de scrollear", () => {
    const section = mountSection("contacto");
    const grid = document.createElement("div");
    grid.className = "reveal-card-grid";
    section.appendChild(grid);

    // Captura el estado del grid EN el momento del scrollIntoView
    let revealedWhenScrolled: boolean | null = null;
    scrollIntoViewMock.mockImplementation(() => {
      revealedWhenScrolled = grid.classList.contains("is-visible");
    });

    mockCssSupports(true);
    mockReducedMotion(false);
    mockStartViewTransition();

    navigateToSection("contacto");

    // El scroll mide un layout YA estable (sin display:none pendiente):
    // si no, la sección crece tras el aterrizaje y el ancla queda
    // desplazada (o el max-scroll recorta el salto en viewports cortos).
    expect(revealedWhenScrolled).toBe(true);
    expect(grid.classList.contains("is-visible")).toBe(true);
  });

  it("no toca los reveal-card-grid de otras secciones", () => {
    mountSection("contacto");
    const otherGrid = document.createElement("div");
    otherGrid.className = "reveal-card-grid";
    mountSection("habilidades").appendChild(otherGrid);

    mockCssSupports(true);
    mockReducedMotion(false);
    mockStartViewTransition();

    navigateToSection("contacto");

    expect(otherGrid.classList.contains("is-visible")).toBe(false);
  });
});
