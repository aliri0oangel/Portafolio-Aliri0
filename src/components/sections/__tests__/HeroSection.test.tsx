import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "../HeroSection";

/**
 * Tests del Hero (Iteración 7):
 * - Sin badge de disponibilidad ni badge redundante de "Full-Stack Software Engineer".
 * - H1 con los tres títulos estáticos apilados en orden vertical:
 *   "Código limpio.", "Experiencias fluidas.", "Resultados reales."
 * - Segunda columna: Sistema orbital interactivo (HeroOrbit) con el avatar de Alirio.
 * - Sin LocalClock en el Hero: se trasladó a ContactSection.
 * - CTAs principales presentes: "Explorar Proyectos" y "Descargar CV".
 */
describe("HeroSection", () => {
  it("no renderiza el badge de disponibilidad", () => {
    render(<HeroSection />);
    expect(
      screen.queryByText(/DISPONIBLE PARA NUEVOS PROYECTOS/),
    ).not.toBeInTheDocument();
  });

  // Fase 1 (TDD): el Hero cubre la pantalla visible completa desde
  // el tope (antes calc(100svh-4rem), que dejaba asomar 64px de la
  // sección siguiente al cargar).
  it("llena el viewport desde el tope: min-h-[100svh]", () => {
    render(<HeroSection />);
    const section = document.getElementById("inicio")!;
    expect(section).toHaveClass("min-h-[100svh]");
  });

  it("no renderiza el badge superior de 'Full-Stack Software Engineer'", () => {
    render(<HeroSection />);
    expect(
      screen.queryByText(/Full-Stack Software Engineer/i),
    ).not.toBeInTheDocument();
  });

  it("el h1 renderiza los tres títulos en orden vertical", () => {
    render(<HeroSection />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Código limpio.");
    expect(heading).toHaveTextContent("Experiencias fluidas.");
    expect(heading).toHaveTextContent("Resultados reales.");

    // Verifica que "Experiencias fluidas." tenga la clase del color esmeralda semántico
    const emeraldSpan = screen.getByText("Experiencias fluidas.");
    expect(emeraldSpan).toHaveClass("text-accent-emerald-bright");
  });

  it("renderiza el sistema orbital interactivo HeroOrbit con el avatar de Alirio", () => {
    render(<HeroSection />);
    expect(screen.getByTestId("hero-orbit")).toBeInTheDocument();
    expect(screen.getByAltText("Avatar de Alirio")).toBeInTheDocument();
  });

  it("no renderiza el widget LocalClock: se trasladó a la sección de contacto", () => {
    render(<HeroSection />);
    expect(screen.queryByText("Zona horaria local")).not.toBeInTheDocument();
    expect(screen.queryByText("UTC-4")).not.toBeInTheDocument();
  });

  it("no renderiza los iconos de contacto en el hero", () => {
    render(<HeroSection />);
    expect(
      screen.queryByRole("link", { name: "GitHub" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "LinkedIn" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "WhatsApp" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Correo" }),
    ).not.toBeInTheDocument();
  });

  it("conserva los CTAs Explorar Proyectos y Descargar CV", () => {
    render(<HeroSection />);
    expect(
      screen.getByRole("link", { name: /Explorar Proyectos/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Descargar CV/i }),
    ).toBeInTheDocument();
  });

  it("no renderiza la tarjeta 'Remote ready'", () => {
    render(<HeroSection />);
    expect(screen.queryByText("Remote ready")).not.toBeInTheDocument();
  });
});

/**
 * Escalado de resoluciones grandes (xl ≥1280 / 2xl ≥1536): el H1 ya
 * escala (xl:text-[3.2rem] / 2xl:text-[3.75rem]); aquí se asegura esa
 * escala y se añade el escalado de descripción, CTAs y gap de columna.
 */
describe("HeroSection — Escala en resoluciones grandes (xl/2xl)", () => {
  it("el H1 conserva la base text-3xl y escala a 2xl:text-[3.75rem]", () => {
    render(<HeroSection />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.className).toContain("text-3xl");
    expect(h1.className).toContain("xl:text-[3.2rem]");
    expect(h1.className).toContain("2xl:text-[3.75rem]");
  });

  it("la descripción escala 2xl:text-lg sobre base text-sm sm:text-base", () => {
    render(<HeroSection />);
    const desc = screen.getByText(/Desarrollador web Full-Stack/);
    expect(desc.className).toContain("text-sm");
    expect(desc.className).toContain("sm:text-base");
    expect(desc.className).toContain("2xl:text-lg");
    expect(desc.className).toContain("xl:max-w-xl");
  });

  it("los CTAs escalan 2xl:text-base 2xl:min-h-12 2xl:px-6 2xl:py-3 (base intacta)", () => {
    render(<HeroSection />);
    for (const name of [/Explorar Proyectos/i, /Descargar CV/i]) {
      const cta = screen.getByRole("link", { name });
      expect(cta.className).toContain("min-h-11");
      expect(cta.className).toContain("px-5");
      expect(cta.className).toContain("py-2.5");
      expect(cta.className).toContain("text-sm");
      expect(cta.className).toContain("2xl:min-h-12");
      expect(cta.className).toContain("2xl:px-6");
      expect(cta.className).toContain("2xl:py-3");
      expect(cta.className).toContain("2xl:text-base");
    }
  });

  it("la columna de textos añade gap-7 en 2xl (base gap-4..lg:gap-6 intacta)", () => {
    render(<HeroSection />);
    const col = document.querySelector("#inicio .flex.flex-col.items-start")!;
    expect(col.className).toContain("gap-4");
    expect(col.className).toContain("lg:gap-6");
    expect(col.className).toContain("2xl:gap-7");
  });
});
