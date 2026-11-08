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
