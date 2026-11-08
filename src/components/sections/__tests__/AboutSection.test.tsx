import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AboutSection } from "../AboutSection";
import { triggerReveal } from "@/__tests__/revealTrigger";

describe("AboutSection", () => {
  it("renderiza el encabezado con eyebrow 'Sobre Mí' y título de sección", () => {
    render(<AboutSection />);
    expect(screen.getByText("Sobre Mí")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Ingeniería de software bien hecha.",
      }),
    ).toBeInTheDocument();
  });

  it("renderiza exactamente 4 tarjetas Bento de pilares", () => {
    render(<AboutSection />);
    const cards = screen.getAllByTestId("about-pillar-card");
    expect(cards).toHaveLength(4);
  });

  it("cada tarjeta incluye la clase cursor-pointer para mejorar la experiencia de usuario", () => {
    render(<AboutSection />);
    const cards = screen.getAllByTestId("about-pillar-card");
    cards.forEach((card) => {
      expect(card).toHaveClass("cursor-pointer");
    });
  });

  it("renderiza los 4 pilares solicitados con sus títulos y descripciones exactas", () => {
    render(<AboutSection />);

    // 1. Código limpio y escalable
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Código limpio y escalable",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Escribo arquitectura sólida, legible y mantenible/i),
    ).toBeInTheDocument();

    // 2. Diseño intuitivo y personalizado
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Diseño intuitivo y personalizado",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Transformo ideas en interfaces atractivas, fluidas y centradas en el usuario/i,
      ),
    ).toBeInTheDocument();

    // 3. Comunicación y confiabilidad
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Comunicación y confiabilidad",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Trabajo con transparencia, entregas puntuales y avances claros/i,
      ),
    ).toBeInTheDocument();

    // 4. Desarrollo en WordPress + WooCommerce
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Desarrollo en WordPress + WooCommerce",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Creo sitios web y tiendas en línea a medida, rápidas y seguras/i,
      ),
    ).toBeInTheDocument();
  });
});

/**
 * Motion System (Ajuste 8): el encabezado se revela con
 * scroll-driven animations (clase `.reveal`) y los 4 pilares usan
 * `@starting-style` — el grid `reveal-card-grid` arranca SIN
 * `is-visible` y `useRevealOnScroll` (IntersectionObserver, once)
 * lo añade al entrar en pantalla.
 */
describe("AboutSection — Motion System (Ajuste 8)", () => {
  it("el encabezado de la sección usa la clase reveal", () => {
    const { container } = render(<AboutSection />);
    const header = container.querySelector("#sobre-mi .reveal");
    expect(header).not.toBeNull();
    expect(header).toContainElement(screen.getByRole("heading", { level: 2 }));
  });

  it("el grid de pilares es reveal-card-grid con 4 reveal-card escalonadas (--i 0..3)", () => {
    const { container } = render(<AboutSection />);
    const grid = container.querySelector("#sobre-mi .reveal-card-grid");
    expect(grid).not.toBeNull();

    const cards = grid!.querySelectorAll(".reveal-card");
    expect(cards).toHaveLength(4);
    cards.forEach((card, index) => {
      expect((card as HTMLElement).style.getPropertyValue("--i")).toBe(
        String(index),
      );
    });
  });

  it("los pilares arrancan ocultos y se revelan al entrar en pantalla", () => {
    const { container } = render(<AboutSection />);
    const grid = container.querySelector("#sobre-mi .reveal-card-grid")!;

    expect(grid.classList.contains("is-visible")).toBe(false);

    expect(triggerReveal(grid)).toBe(true);
    expect(grid.classList.contains("is-visible")).toBe(true);
  });
});
