import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "../SectionHeader";

/**
 * Tests de SectionHeader (Fase 1 — TDD).
 *
 * Valida: render de eyebrow/título, semántica de heading,
 * accesibilidad de la línea decorativa, tokens de color y
 * composición con className externo.
 */
describe("SectionHeader", () => {
  const props = {
    eyebrow: "Arsenal tech",
    title: "Habilidades y conocimientos técnicos",
  };

  it("renderiza el eyebrow y el título", () => {
    render(<SectionHeader {...props} />);
    expect(screen.getByText("Arsenal tech")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: props.title }),
    ).toBeInTheDocument();
  });

  it("la línea decorativa del eyebrow es aria-hidden", () => {
    render(<SectionHeader {...props} />);
    // El pseudo-elemento ::before no es accesible; el span contenedor
    // lleva el texto visible. Verificamos que el eyebrow existe como
    // span y no como heading (no debe competir con el H2).
    const eyebrow = screen.getByText("Arsenal tech");
    expect(eyebrow.tagName).toBe("SPAN");
  });

  it("aplica el token de acento esmeralda al eyebrow", () => {
    render(<SectionHeader {...props} />);
    const eyebrow = screen.getByText("Arsenal tech");
    expect(eyebrow.className).toContain("text-accent-emerald");
    // La línea ::before hereda currentColor del span.
    expect(eyebrow.className).toContain("before:bg-current");
  });

  it("aplica las clases tipográficas del H2", () => {
    render(<SectionHeader {...props} />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.className).toContain("text-3xl");
    expect(heading.className).toContain("font-bold");
    expect(heading.className).toContain("tracking-tight");
  });

  it("acepta className externo para composición", () => {
    render(<SectionHeader {...props} className="mb-20" />);
    const wrapper = screen.getByRole("heading", { level: 2 }).parentElement;
    expect(wrapper?.className).toContain("mb-20");
  });

  it("expone data-nav-anchor en el header para la navegación por scroll", () => {
    render(<SectionHeader {...props} />);
    const header = screen.getByRole("heading", { level: 2 }).closest("header");
    expect(header).toHaveAttribute("data-nav-anchor");
  });
});

/**
 * Escalado de resoluciones grandes (xl ≥1280 / 2xl ≥1536): el H2 sigue
 * el patrón del Hero (xl + 2xl variantes) sin tocar la base text-3xl
 * que validan los tests de composición. Las 4 secciones usan este
 * componente, por lo que el escalado es transversal al sitio.
 */
describe("SectionHeader — Escala en resoluciones grandes (xl/2xl)", () => {
  const props = {
    eyebrow: "Arsenal tech",
    title: "Habilidades y conocimientos técnicos",
  };

  it("el H2 conserva text-3xl y escala a 52px en 2xl (base intacta)", () => {
    render(<SectionHeader {...props} />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.className).toContain("text-3xl");
    expect(heading.className).toContain("xl:text-[2.75rem]");
    expect(heading.className).toContain("2xl:text-[3.25rem]");
  });

  it("la descripción escala a 2xl:text-lg con ancho ampliado en 2xl", () => {
    render(<SectionHeader {...props} description="Descripción de prueba." />);
    const desc = screen.getByText("Descripción de prueba.");
    expect(desc.className).toContain("text-base");
    expect(desc.className).toContain("xl:max-w-3xl");
    expect(desc.className).toContain("2xl:text-lg");
    expect(desc.className).toContain("2xl:max-w-4xl");
  });

  it("el eyebrow escala a 2xl:text-sm sobre base text-xs", () => {
    render(<SectionHeader {...props} />);
    const eyebrow = screen.getByText(props.eyebrow);
    expect(eyebrow.className).toContain("text-xs");
    expect(eyebrow.className).toContain("2xl:text-sm");
  });
});
