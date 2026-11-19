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
        name: "Obsesión por el detalle, rigor en el código.",
      }),
    ).toBeInTheDocument();
  });

  // Fase 1 (TDD): la sección llena la pantalla visible (patrón
  // herasi.dev) — min-h-[100svh] + bump por breakpoint (sin centrado:
  // el aterrizaje por ancla exige top-align; ver sectionClassNames.ts).
  it("llena el viewport: min-h-[100svh] + bumps sm/lg + py de referencia", () => {
    render(<AboutSection />);
    const section = document.getElementById("sobre-mi")!;
    expect(section).toHaveClass("min-h-[100svh]");
    expect(section).toHaveClass("sm:min-h-[calc(100svh+0.5rem)]");
    expect(section).toHaveClass("lg:min-h-[calc(100svh+1.5rem)]");
    expect(section.className).toContain("py-20 sm:py-24 lg:py-28");
  });

  // Fase 2 (TDD): stretch-fill — el contenido se estira a la altura
  // disponible (flex + auto-rows-fr + h-full, patrón herasi.dev) para
  // equilibrio vertical en viewports altos, SIN justify-center (rompería
  // el aterrizaje por ancla). Ver sectionClassNames.ts.
  it("estira el contenido: flex en sección/contenedor, auto-rows-fr en grilla y h-full en tarjetas", () => {
    render(<AboutSection />);
    const section = document.getElementById("sobre-mi")!;
    expect(section).toHaveClass("flex");
    expect(section).toHaveClass("flex-col");
    expect(section).not.toHaveClass("justify-center");

    const container = section.querySelector(":scope > div")!;
    expect(container).toHaveClass("flex-1");
    expect(container).toHaveClass("flex-col");

    const cards = screen.getAllByTestId("about-pillar-card");
    const grid = cards[0].parentElement!;
    expect(grid).toHaveClass("auto-rows-fr");
    expect(grid).toHaveClass("flex-1");
    cards.forEach((card) => expect(card).toHaveClass("h-full"));
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

/**
 * Escalado de resoluciones grandes (xl ≥1280 / 2xl ≥1536): tipografía,
 * iconos, padding y glow de las 4 BentoCards escalan con variantes
 * xl:/2xl: sin tocar las clases base (tests anteriores intactos).
 */
describe("AboutSection — Escala en resoluciones grandes (xl/2xl)", () => {
  it("los H3 escalan xl:text-xl / 2xl:text-2xl sin perder la base text-lg", () => {
    render(<AboutSection />);
    const titulos = [
      "Código limpio y escalable",
      "Diseño intuitivo y personalizado",
      "Comunicación y confiabilidad",
      "Desarrollo en WordPress + WooCommerce",
    ];
    for (const name of titulos) {
      const h3 = screen.getByRole("heading", { level: 3, name });
      expect(h3.className).toContain("text-lg");
      expect(h3.className).toContain("xl:text-xl");
      expect(h3.className).toContain("2xl:text-2xl");
    }
  });

  it("las descripciones escalan xl:text-base / 2xl:text-[1.125rem] sobre base text-sm", () => {
    render(<AboutSection />);
    const desc = screen.getByText(/Escribo arquitectura sólida/);
    expect(desc.className).toContain("text-sm");
    expect(desc.className).toContain("xl:text-base");
    expect(desc.className).toContain("2xl:text-[1.125rem]");
  });

  it("la caja del icono y su icono escalan en xl/2xl sobre base h-10/h-5", () => {
    render(<AboutSection />);
    const card = screen.getAllByTestId("about-pillar-card")[0];
    const iconBox = card.querySelector("svg")!.parentElement!;
    expect(iconBox.className).toContain("h-10 w-10");
    expect(iconBox.className).toContain("xl:h-12 xl:w-12");
    expect(iconBox.className).toContain("2xl:h-14 2xl:w-14");

    const icon = iconBox.querySelector("svg")!;
    expect(icon.getAttribute("class")).toContain("h-5 w-5");
    expect(icon.getAttribute("class")).toContain("xl:h-6");
    expect(icon.getAttribute("class")).toContain("2xl:h-7");
  });

  it("la fila de la tarjeta añade gap-4 en 2xl (base gap-3 intacta)", () => {
    render(<AboutSection />);
    const card = screen.getAllByTestId("about-pillar-card")[0];
    expect(card.className).toContain("gap-3");
    expect(card.className).toContain("2xl:gap-4");
  });

  it("el glow de hover se refuerza con shadow esmeralda en 2xl", () => {
    render(<AboutSection />);
    const card = screen.getAllByTestId("about-pillar-card")[0];
    expect(card.className).toContain(
      "2xl:hover:shadow-[0_0_32px_var(--glow-emerald)]",
    );
  });

  it("la BentoCard escala xl:p-7 / 2xl:p-8 sobre base p-6", () => {
    render(<AboutSection />);
    const card = screen.getAllByTestId("about-pillar-card")[0];
    expect(card.className).toContain("p-6");
    expect(card.className).toContain("xl:p-7");
    expect(card.className).toContain("2xl:p-8");
  });
});
