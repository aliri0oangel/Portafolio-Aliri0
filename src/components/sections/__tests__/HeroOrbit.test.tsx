import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { HeroOrbit } from "../HeroOrbit";
import {
  pieceVariants,
  reducedPieceVariants,
  systemVariants,
} from "../heroOrbitMotion";

/**
 * Suite del sistema orbital (Iteración 8 — estilo chiragchrg.netlify.app).
 *
 * Contratos:
 * - Proporciones de la referencia: contenedor 340→500px, avatar 180→250px,
 *   4 anillos al 60/70/80/90% (interior → exterior).
 * - Sin riel base: cada anillo es solo el arco conic enmascarado.
 * - Rotaciones 6/8/10/12s con sentidos cw/ccw/cw/ccw (interior → exterior).
 * - Gradiente alternado A/B (impares A, pares B) con tokens propios.
 * - Punto teardrop (variante `--alt` en anillos 2 y 4).
 * - Interacción de presión global vía `data-pressed` en la raíz.
 * - Presión sin desaparición: `press` declara `opacity: 1`, el puntero se
 *   captura al pulsar y el gesto se cierra en pointerup/cancel, pérdida de
 *   la captura o blur (no en pointerleave).
 */
describe("HeroOrbit", () => {
  it("renderiza el contenedor del sistema orbital con testid y aria-label", () => {
    render(<HeroOrbit />);
    const container = screen.getByTestId("hero-orbit");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute(
      "aria-label",
      "Sistema orbital interactivo con avatar de Alirio",
    );
  });

  it("renderiza la imagen del avatar de Alirio con su atributo alt correspondiente", () => {
    render(<HeroOrbit />);
    const avatarImg = screen.getByAltText("Avatar de Alirio");
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg.getAttribute("src")).toContain("avatar_alirio.webp");
  });

  it("el núcleo central es interactivo con rol de botón y aria-label", () => {
    render(<HeroOrbit />);
    const coreButton = screen.getByRole("button", {
      name: /Avatar de Alirio — haz click para interactuar/i,
    });
    expect(coreButton).toBeInTheDocument();
    expect(coreButton).toHaveAttribute("tabindex", "0");
  });

  it("renderiza la pista táctil para invitar a la interacción", () => {
    render(<HeroOrbit />);
    expect(
      screen.getByText(/mantén presionado para interactuar/i),
    ).toBeInTheDocument();
  });

  it("responde a los eventos pointerdown y pointerup en el avatar", () => {
    render(<HeroOrbit />);
    const coreButton = screen.getByRole("button", {
      name: /Avatar de Alirio — haz click para interactuar/i,
    });
    fireEvent.pointerDown(coreButton);
    fireEvent.pointerUp(coreButton);
    expect(coreButton).toBeInTheDocument();
  });

  /* ==================== Proporciones (Fase 1) ==================== */

  it("el contenedor adopta el tamaño de la referencia (340 → 500px)", () => {
    render(<HeroOrbit />);
    const container = screen.getByTestId("hero-orbit");
    expect(container.className).toContain("max-w-[340px]");
    expect(container.className).toContain("lg:max-w-[500px]");
  });

  it("el avatar adopta el tamaño de la referencia (180 → 250px)", () => {
    render(<HeroOrbit />);
    const coreButton = screen.getByRole("button", {
      name: /Avatar de Alirio — haz click para interactuar/i,
    });
    expect(coreButton.className).toContain("w-[180px]");
    expect(coreButton.className).toContain("md:w-[220px]");
    expect(coreButton.className).toContain("lg:w-[250px]");
  });

  it("renderiza 4 anillos con las proporciones 90/80/70/60% (exterior → interior)", () => {
    render(<HeroOrbit />);
    const trails = screen.getAllByTestId("orbit-trail");
    expect(trails).toHaveLength(4);
    expect(trails.map((t) => t.className)).toEqual([
      expect.stringContaining("w-[90%]"),
      expect.stringContaining("w-[80%]"),
      expect.stringContaining("w-[70%]"),
      expect.stringContaining("w-[60%]"),
    ]);
  });

  /* ==================== Estilo de anillo (Fase 2) ==================== */

  it("los anillos no tienen riel base: solo la máscara del arco conic", () => {
    const { container } = render(<HeroOrbit />);
    const root = screen.getByTestId("hero-orbit");
    // Sin círculos base dashed/solid (riel) dentro del sistema orbital
    expect(root.querySelector('[class*="border-dashed"]')).toBeNull();
    // Las 4 máscaras de arco están presentes
    expect(container.querySelectorAll(".orbit-trail-mask")).toHaveLength(4);
  });

  it("aplica el gradiente conic alternado A/B (impares A, pares B)", () => {
    render(<HeroOrbit />);
    const trails = screen.getAllByTestId("orbit-trail");
    // Anillo 4 (90%) = B, anillo 3 (80%) = A, anillo 2 (70%) = B, anillo 1 (60%) = A
    expect(trails[0].querySelector(".orbit-gradient-b")).not.toBeNull();
    expect(trails[1].querySelector(".orbit-gradient-a")).not.toBeNull();
    expect(trails[2].querySelector(".orbit-gradient-b")).not.toBeNull();
    expect(trails[3].querySelector(".orbit-gradient-a")).not.toBeNull();
  });

  it("los gradientes arrancan en 0° (sin `from` desplazado) para que el punto marque la cabeza del arco", () => {
    const globals = readFileSync(
      path.resolve(__dirname, "../../../app/globals.css"),
      "utf8",
    );
    const block = globals.match(/\.orbit-gradient-[ab]\s*\{[^}]*\}/g) ?? [];
    expect(block).toHaveLength(2);
    // Sin desplazamiento angular: el punto (0°, 12 en punto) debe coincidir
    // con la discontinuidad transparente→color del conic-gradient.
    for (const rule of block) {
      expect(rule).not.toMatch(/conic-gradient\(\s*from\s/);
      expect(rule).toMatch(/conic-gradient\(/);
    }
  });

  it("la cabeza de cada gradiente coincide con el color del punto de su anillo", () => {
    const globals = readFileSync(
      path.resolve(__dirname, "../../../app/globals.css"),
      "utf8",
    );
    const gradA = globals.match(/\.orbit-gradient-a\s*\{[^}]*\}/)?.[0] ?? "";
    const gradB = globals.match(/\.orbit-gradient-b\s*\{[^}]*\}/)?.[0] ?? "";
    const stopsOf = (rule: string) =>
      [...rule.matchAll(/var\((--accent-[a-z-]+)\)/g)].map((m) => m[1]);

    const stopsA = stopsOf(gradA);
    const stopsB = stopsOf(gradB);
    expect(stopsA.length).toBeGreaterThanOrEqual(3);
    expect(stopsB.length).toBeGreaterThanOrEqual(3);
    // A: último stop (360° = cabeza en el punto) esmeralda → puntos esmeralda (60/80%)
    expect(stopsA.at(-1)).toBe("--accent-emerald-bright");
    // B: primer stop (0° = cabeza en el punto) cian → puntos cian (70/90%)
    expect(stopsB[0]).toBe("--accent-cyan-bright");

    render(<HeroOrbit />);
    const trails = screen.getAllByTestId("orbit-trail");
    // Orden DOM exterior → interior: B(cian), A(emerald), B(cian), A(emerald)
    const expected = [
      "text-accent-cyan-bright",
      "text-accent-emerald-bright",
      "text-accent-cyan-bright",
      "text-accent-emerald-bright",
    ];
    trails.forEach((trail, index) => {
      expect(trail.querySelector(".orbit-dot")?.className).toContain(
        expected[index],
      );
    });
  });

  /* ==================== Rotación (Fase 4) ==================== */

  it("cada anillo rota con duración y sentido 12/10/8/6s ccw/cw/ccw/cw (exterior → interior)", () => {
    render(<HeroOrbit />);
    const rotators = screen.getAllByTestId("orbit-rotator");
    expect(rotators).toHaveLength(4);

    const spec = [
      { duration: "12s", dir: "orbit-rotator-ccw" },
      { duration: "10s", dir: "orbit-rotator-cw" },
      { duration: "8s", dir: "orbit-rotator-ccw" },
      { duration: "6s", dir: "orbit-rotator-cw" },
    ];

    rotators.forEach((rotator, index) => {
      expect(rotator.style.getPropertyValue("--orbit-duration")).toBe(
        spec[index].duration,
      );
      expect(rotator.className).toContain(spec[index].dir);
    });
  });

  /* ==================== Punto teardrop (Fase 3) ==================== */

  it("renderiza 4 puntos teardrop con la variante alterna en los anillos 2 y 4", () => {
    const { container } = render(<HeroOrbit />);
    const dots = container.querySelectorAll(".orbit-dot");
    expect(dots).toHaveLength(4);
    const altDots = container.querySelectorAll(".orbit-dot--alt");
    expect(altDots).toHaveLength(2);
    // Los anillos exteriores (90% y 70%) llevan la variante alterna
    const trails = screen.getAllByTestId("orbit-trail");
    expect(trails[0].querySelector(".orbit-dot--alt")).not.toBeNull();
    expect(trails[2].querySelector(".orbit-dot--alt")).not.toBeNull();
  });

  /* ==================== Interacción de presión (Fase 6) ==================== */

  it("marca data-pressed en la raíz al presionar y lo limpia al soltar el avatar", () => {
    render(<HeroOrbit />);
    const root = screen.getByTestId("hero-orbit");
    const coreButton = screen.getByRole("button", {
      name: /Avatar de Alirio — haz click para interactuar/i,
    });

    expect(root).toHaveAttribute("data-pressed", "false");

    fireEvent.pointerDown(coreButton);
    expect(root).toHaveAttribute("data-pressed", "true");

    fireEvent.pointerUp(coreButton);
    expect(root).toHaveAttribute("data-pressed", "false");
  });

  it("el avatar se renderiza dentro de un wrapper sin bordes ni glow (estilo referencia)", () => {
    render(<HeroOrbit />);
    const coreButton = screen.getByRole("button", {
      name: /Avatar de Alirio — haz click para interactuar/i,
    });
    // Sin borde grueso ni sombra de glow: solo el contenedor redondo
    expect(coreButton.className).not.toContain("border-2");
    expect(coreButton.className).not.toContain("shadow-[0_0_35px");
    // Imagen a sangre completa dentro del círculo
    const img = within(coreButton).getByAltText("Avatar de Alirio");
    expect(img.className).toContain("rounded-full");
  });

  /* ============ Presión sin desaparición (fix 2 — opacidad fija) ============ */

  it("la variante de presión declara opacidad 1 para no desvanecer el sistema", () => {
    expect(pieceVariants.press).toMatchObject({ opacity: 1, scale: 0.75 });
    expect(reducedPieceVariants.press).toMatchObject({ opacity: 1 });
  });

  it("la presión separa la transición de opacidad (tween) de la escala (150 ms)", () => {
    expect(pieceVariants.press).toMatchObject({
      transition: {
        opacity: { duration: 0.15, ease: "easeOut" },
        scale: { duration: 0.15, ease: "easeOut" },
      },
    });
  });

  it("el retorno a tamaño completo conserva la opacidad y crece con spring", () => {
    expect(pieceVariants.show).toMatchObject({
      opacity: 1,
      scale: 1,
      transition: {
        opacity: { duration: 0.2, ease: "easeOut" },
        scale: { type: "spring", bounce: 0.6, duration: 1.8 },
      },
    });
  });

  /* ============ Presión sin desaparición (fix 2 — puntero capturado) ============ */

  it("captura el puntero al presionar para no perder la presión al contraerse", () => {
    render(<HeroOrbit />);
    const coreButton = screen.getByRole("button", {
      name: /Avatar de Alirio — haz click para interactuar/i,
    });
    const setPointerCapture = vi.fn();
    Object.defineProperty(coreButton, "setPointerCapture", {
      value: setPointerCapture,
      configurable: true,
    });

    fireEvent.pointerDown(coreButton, { pointerId: 7 });

    expect(setPointerCapture).toHaveBeenCalledTimes(1);
    expect(setPointerCapture).toHaveBeenCalledWith(7);
  });

  it("mantiene la presión si el puntero sale y la libera al cancelar", () => {
    render(<HeroOrbit />);
    const root = screen.getByTestId("hero-orbit");
    const coreButton = screen.getByRole("button", {
      name: /Avatar de Alirio — haz click para interactuar/i,
    });

    fireEvent.pointerDown(coreButton);
    fireEvent.pointerLeave(coreButton);
    expect(root).toHaveAttribute("data-pressed", "true");

    fireEvent.pointerCancel(coreButton);
    expect(root).toHaveAttribute("data-pressed", "false");
  });

  it("libera la presión al perder la captura del puntero", () => {
    render(<HeroOrbit />);
    const root = screen.getByTestId("hero-orbit");
    const coreButton = screen.getByRole("button", {
      name: /Avatar de Alirio — haz click para interactuar/i,
    });

    fireEvent.pointerDown(coreButton);
    fireEvent.lostPointerCapture(coreButton);
    expect(root).toHaveAttribute("data-pressed", "false");
  });

  it("libera la presión al perder el foco de teclado", () => {
    render(<HeroOrbit />);
    const root = screen.getByTestId("hero-orbit");
    const coreButton = screen.getByRole("button", {
      name: /Avatar de Alirio — haz click para interactuar/i,
    });

    fireEvent.keyDown(coreButton, { key: "Enter" });
    expect(root).toHaveAttribute("data-pressed", "true");

    fireEvent.blur(coreButton);
    expect(root).toHaveAttribute("data-pressed", "false");
  });

  /* ======== Orden de retorno (Ajuste 3: el avatar empuja hacia afuera) ======== */

  it("declara un retorno con stagger invertido (avatar primero, anillos dentro→fuera)", () => {
    expect(systemVariants.release).toMatchObject({
      transition: {
        staggerDirection: -1,
        staggerChildren: 0.06,
        delayChildren: 0.04,
      },
    });
    expect(pieceVariants.release).toMatchObject({ opacity: 1, scale: 1 });
    expect(reducedPieceVariants.release).toMatchObject({ opacity: 1 });
  });

  it("tras soltar anima con la variante release (la entrada inicial sigue en show)", () => {
    render(<HeroOrbit />);
    const root = screen.getByTestId("hero-orbit");
    const coreButton = screen.getByRole("button", {
      name: /Avatar de Alirio — haz click para interactuar/i,
    });

    expect(root).toHaveAttribute("data-motion-state", "show");

    fireEvent.pointerDown(coreButton);
    expect(root).toHaveAttribute("data-motion-state", "press");

    fireEvent.pointerUp(coreButton);
    expect(root).toHaveAttribute("data-motion-state", "release");
  });
});
