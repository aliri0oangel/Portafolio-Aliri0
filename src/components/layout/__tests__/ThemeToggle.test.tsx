import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { act } from "react";
import { ThemeToggle } from "../ThemeToggle";

// Entorno de act() para el hydrateRoot manual de este archivo
// (Testing Library no lo configura fuera de sus propios renders).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Mock de `next-themes` con flag de fase: reproduce fielmente el
 * comportamiento real de la librería (0.4.6) que jsdom solo no puede
 * dar porque ahí `window` existe:
 *
 * - Fase "server": `useTheme().resolvedTheme === undefined` (la lib
 *   corta `localStorage` con `typeof window === "undefined"`).
 * - Fase "client": `resolvedTheme` = `current` (defaultTheme dark).
 *
 * Como en el proveedor real, `setTheme` notifica a los suscriptores
 * (vía `useSyncExternalStore`) para que el consumidor se re-renderice
 * con el tema nuevo.
 */
const themeState = vi.hoisted(() => ({
  phase: "server" as "server" | "client",
  current: "dark" as "dark" | "light",
  listeners: new Set<() => void>(),
  setTheme: vi.fn(),
}));

vi.mock("next-themes", async () => {
  const { useSyncExternalStore } = await import("react");
  const subscribe = (onChange: () => void) => {
    themeState.listeners.add(onChange);
    return () => {
      themeState.listeners.delete(onChange);
    };
  };
  const readTheme = () =>
    themeState.phase === "server" ? undefined : themeState.current;

  return {
    useTheme: () => ({
      resolvedTheme: useSyncExternalStore(subscribe, readTheme, readTheme),
      setTheme: themeState.setTheme,
    }),
  };
});

/** Selecciona el knob del switch por su testid. */
function knobOf(root: ParentNode): Element | null {
  return root.querySelector('[data-testid="theme-knob"]');
}

/**
 * Tests del conmutador de tema (TDD: regresión del error de
 * hidratación "A tree hydrated but some attributes of the server
 * rendered HTML didn't match the client properties" + Ajuste 18
 * switch con knob deslizante).
 *
 * Garantiza: los atributos `aria-*` y la posición del knob solo se
 * derivan del tema real DESPUÉS de hidratar (gate con `mounted`), de
 * modo que el primer commit del cliente es idéntico al HTML del
 * servidor, y la clase de animación del knob nunca está en el primer
 * pintado (se arma recién tras el primer clic).
 */
describe("ThemeToggle", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let container: HTMLDivElement | undefined;
  let root: Root | undefined;

  beforeEach(() => {
    themeState.phase = "server";
    themeState.current = "dark";
    themeState.listeners.clear();
    themeState.setTheme.mockReset();
    themeState.setTheme.mockImplementation((next: string) => {
      themeState.current = next as "dark" | "light";
      themeState.listeners.forEach((notify) => notify());
    });
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount());
      root = undefined;
    }
    container?.remove();
    container = undefined;
    document.body.innerHTML = "";
    errorSpy.mockRestore();
  });

  it("render de servidor: switch con aria-checked neutro, knob en claro y placeholder sin icono", () => {
    const html = renderToString(<ThemeToggle />);
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain("Cambiar a modo oscuro");
    expect(html).not.toContain("<svg");
    // Knob presente pero en posición de claro (isDark=false en SSR)
    // y sin clase de animación: nada se mueve en el primer pintado.
    expect(html).toContain('data-testid="theme-knob"');
    expect(html).toContain("translate-x-0");
    expect(html).not.toMatch(/theme-knob--to-/);
  });

  it("se hidrata sin errores de consola cuando el cliente resuelve dark (regresión)", async () => {
    container = document.createElement("div");
    container.innerHTML = renderToString(<ThemeToggle />);
    document.body.appendChild(container);

    themeState.phase = "client";

    await act(async () => {
      root = hydrateRoot(container as HTMLDivElement, <ThemeToggle />);
    });
    // Primer commit del cliente: debe coincidir con el HTML del servidor
    const hydrationErrors = errorSpy.mock.calls.filter((args: unknown[]) =>
      /hydrat|didn't match|did not match/i.test(String(args[0])),
    );
    expect(hydrationErrors).toHaveLength(0);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("tras hidratar refleja el tema real (dark): switch, knob a la derecha y ambos iconos", async () => {
    container = document.createElement("div");
    container.innerHTML = renderToString(<ThemeToggle />);
    document.body.appendChild(container);

    themeState.phase = "client";

    await act(async () => {
      root = hydrateRoot(container as HTMLDivElement, <ThemeToggle />);
    });

    const toggle = container.querySelector('[role="switch"]');
    expect(toggle).toBeTruthy();
    expect(toggle?.getAttribute("aria-checked")).toBe("true");
    expect(toggle?.getAttribute("aria-label")).toBe("Cambiar a modo claro");

    const knob = knobOf(container as HTMLDivElement);
    expect(knob).toBeTruthy();
    // Oscuro → knob desplazado 20 px (recorrido completo a la derecha)
    expect(knob?.className).toContain("translate-x-5");
    expect(knob?.className).not.toContain("translate-x-0");
    // Sin animación en el primer pintado (se arma tras el primer clic)
    expect(knob?.className).not.toMatch(/theme-knob--to-/);

    // Ambos iconos apilados en el knob: luna visible en oscuro, sol oculto
    const sun = knob?.querySelector(".theme-knob__icon--sun");
    const moon = knob?.querySelector(".theme-knob__icon--moon");
    expect(sun).toBeTruthy();
    expect(moon).toBeTruthy();
    expect(sun?.getAttribute("class")).toContain("opacity-0");
    expect(moon?.getAttribute("class")).toContain("opacity-100");
    // Iconos de 12 px (h-3 w-3), centrados dentro del knob
    expect(sun?.getAttribute("class")).toContain("h-3 w-3");
    expect(sun?.getAttribute("class")).toContain("absolute");
  });

  it("el click alterna al modo claro: setTheme('light'), knob a la izquierda y animación armada", async () => {
    themeState.phase = "client";
    const { render, screen } = await import("@testing-library/react");
    const view = render(<ThemeToggle />);

    const toggle = screen.getByRole("switch", { name: /cambiar a modo/i });
    expect(toggle.getAttribute("aria-checked")).toBe("true");

    const knobBefore = screen.getByTestId("theme-knob");
    expect(knobBefore.className).toContain("translate-x-5");
    expect(knobBefore.className).not.toMatch(/theme-knob--to-/);

    await act(async () => {
      toggle.click();
    });

    expect(themeState.setTheme).toHaveBeenCalledWith("light");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(toggle.getAttribute("aria-label")).toBe("Cambiar a modo oscuro");

    // Knob regresado a la izquierda + clase de animación de ida a claro
    const knob = screen.getByTestId("theme-knob");
    expect(knob.className).toContain("translate-x-0");
    expect(knob.className).toContain("theme-knob--to-light");

    // Iconos invertidos tras el clic: sol visible en claro, luna oculta
    expect(
      knob.querySelector(".theme-knob__icon--sun")?.getAttribute("class"),
    ).toContain("opacity-100");
    expect(
      knob.querySelector(".theme-knob__icon--moon")?.getAttribute("class"),
    ).toContain("opacity-0");

    view.unmount();
  });

  it("segunda alternancia reutiliza la animación con la dirección contraria", async () => {
    themeState.phase = "client";
    const { render, screen } = await import("@testing-library/react");
    const view = render(<ThemeToggle />);
    const toggle = screen.getByRole("switch");
    const knob = () => screen.getByTestId("theme-knob");

    // 1ª alternancia: oscuro → claro
    await act(async () => {
      toggle.click();
    });
    expect(knob().className).toContain("theme-knob--to-light");

    // 2ª alternancia: claro → oscuro (misma clase, dirección opuesta →
    // el cambio de nombre reinicia la @keyframes)
    await act(async () => {
      toggle.click();
    });
    expect(themeState.setTheme).toHaveBeenLastCalledWith("dark");
    expect(knob().className).toContain("translate-x-5");
    expect(knob().className).toContain("theme-knob--to-dark");
    expect(knob().className).not.toContain("theme-knob--to-light");

    view.unmount();
  });
});
