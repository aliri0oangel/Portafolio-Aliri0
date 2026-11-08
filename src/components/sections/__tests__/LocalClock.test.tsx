import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocalClock } from "../LocalClock";

/**
 * Tests del widget de hora local (Ajuste 6).
 *
 * `LocalClock` usa `useSyncExternalStore`, cuyo contrato exige que
 * `getSnapshot` devuelva un valor **cacheado con identidad estable**
 * (solo cambia cuando la tienda notifica). React verifica esto leyendo
 * `getSnapshot` dos veces seguidas en desarrollo y comparando con
 * `Object.is`: si difieren, emite "The result of getSnapshot should be
 * cached to avoid an infinite loop".
 *
 * El test clave mockea el formatter para que **avance en cada lectura**
 * (reproduciendo `new Date()`), de modo que un `getSnapshot` que
 * recalcula del reloj viola el contrato de forma determinista.
 */
describe("LocalClock — contrato de useSyncExternalStore (Ajuste 6)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("getSnapshot es cacheado: React no detecta un bucle infinito", () => {
    // Simula el reloj vivo: el formatter devuelve un valor distinto en
    // CADA lectura (como `new Date()` en producción), de modo que un
    // `getSnapshot` que recalcula del reloj viola el contrato.
    let counter = 0;
    const mockIntl = Object.create(Intl) as typeof Intl;
    mockIntl.DateTimeFormat = class {
      format() {
        return `T${counter++}`;
      }
    } as unknown as typeof Intl.DateTimeFormat;
    vi.stubGlobal("Intl", mockIntl);

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // React puede manifestar el getSnapshot no cacheado lanzando
    // ("Maximum update depth exceeded") o por consola ("getSnapshot
    // should be cached"): ambos indican inestabilidad.
    let caught: unknown;
    try {
      render(<LocalClock />);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    } catch (error) {
      caught = error;
    }

    const loopWarning = errorSpy.mock.calls.find((args) =>
      String(args[0]).includes("getSnapshot should be cached"),
    );

    expect(
      caught,
      "React lanzó un error de bucle infinito (getSnapshot no cacheado)",
    ).toBeUndefined();
    expect(
      loopWarning,
      "React emitió 'getSnapshot should be cached' (getSnapshot no cacheado)",
    ).toBeUndefined();
  });

  it("muestra la hora real y avanza cada segundo (regresión)", () => {
    // 15:45:12 en America/Caracas (UTC-4) a partir de 19:45:12 UTC.
    vi.setSystemTime(new Date("2026-11-01T19:45:12.000Z"));
    const { container } = render(<LocalClock />);

    const clock = container.querySelector(".tabular-nums");
    const before = clock?.textContent ?? "";
    expect(before).not.toBe("--:--:--");
    expect(before).toMatch(/\d{1,2}:\d{2}:\d{2}/);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const after = clock?.textContent ?? "";
    expect(after).not.toBe(before);
  });

  it("en el servidor (SSR) renderiza el placeholder", () => {
    const html = renderToStaticMarkup(<LocalClock />);
    expect(html).toContain("--:--:--");
  });

  it("variante 'pill': muestra 'Venezuela', UTC-4 y la hora en vivo", () => {
    // 15:45:12 en America/Caracas (UTC-4) a partir de 19:45:12 UTC.
    vi.setSystemTime(new Date("2026-11-01T19:45:12.000Z"));
    const { container } = render(<LocalClock variant="pill" />);

    // Etiqueta de la variante pill (estilo navbar de referencia)
    expect(screen.getByText("Venezuela")).toBeInTheDocument();
    const utc = container.querySelector(".tabular-nums");
    expect(utc).toHaveTextContent("UTC-4");

    // La hora sigue viva y avanza cada segundo (misma suscripción)
    const clock = utc?.textContent ?? "";
    expect(clock).not.toBe("--:--:--");
    expect(clock).toMatch(/\d{1,2}:\d{2}:\d{2}/);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(utc?.textContent).not.toBe(clock);
  });

  it("la variante por defecto NO muestra la etiqueta 'Venezuela'", () => {
    vi.setSystemTime(new Date("2026-11-01T19:45:12.000Z"));
    render(<LocalClock />);
    expect(screen.queryByText("Venezuela")).not.toBeInTheDocument();
    expect(screen.getByText("Zona horaria local")).toBeInTheDocument();
  });
});
