import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInitialHash } from "../useInitialHash";

describe("useInitialHash (Ajuste 17)", () => {
  let scrollIntoViewMock: ReturnType<typeof vi.fn>;
  let rafCallbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    scrollIntoViewMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      writable: true,
      configurable: true,
      value: scrollIntoViewMock,
    });

    rafCallbacks = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete (
      HTMLElement.prototype as unknown as Record<string, unknown>
    ).scrollIntoView;
    window.location.hash = "";
    vi.restoreAllMocks();
  });

  function flushRaf() {
    // Procesa todos los frames pendientes (incluyendo anidados)
    while (rafCallbacks.length > 0) {
      const cbs = [...rafCallbacks];
      rafCallbacks = [];
      for (const cb of cbs) {
        cb(performance.now());
      }
    }
  }

  function mountSection(id: string) {
    const section = document.createElement("section");
    section.id = id;

    const anchor = document.createElement("header");
    anchor.setAttribute("data-nav-anchor", "");
    section.appendChild(anchor);

    const cardGrid = document.createElement("div");
    cardGrid.className = "reveal-card-grid";
    section.appendChild(cardGrid);

    document.body.appendChild(section);
    return { section, anchor, cardGrid };
  }

  it("con hash #proyectos → revela tarjetas destino y scrollea al anchor", () => {
    window.location.hash = "#proyectos";
    const { cardGrid, anchor } = mountSection("proyectos");

    expect(cardGrid.classList.contains("is-visible")).toBe(false);

    renderHook(() => useInitialHash());
    flushRaf();

    expect(cardGrid.classList.contains("is-visible")).toBe(true);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    expect(anchor).toBe(document.querySelector("#proyectos [data-nav-anchor]"));
  });

  it("con hash #contacto → revela tarjetas destino y scrollea al anchor", () => {
    window.location.hash = "#contacto";
    const { cardGrid } = mountSection("contacto");

    expect(cardGrid.classList.contains("is-visible")).toBe(false);

    renderHook(() => useInitialHash());
    flushRaf();

    expect(cardGrid.classList.contains("is-visible")).toBe(true);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("sin hash → noop", () => {
    window.location.hash = "";
    mountSection("proyectos");

    renderHook(() => useInitialHash());
    flushRaf();

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it("con hash que no coincide con ninguna sección → noop", () => {
    window.location.hash = "#inexistente";
    mountSection("proyectos");

    renderHook(() => useInitialHash());
    flushRaf();

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });
});
