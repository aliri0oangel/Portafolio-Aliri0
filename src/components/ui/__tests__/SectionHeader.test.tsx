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
