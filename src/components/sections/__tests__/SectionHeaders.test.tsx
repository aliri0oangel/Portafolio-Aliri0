import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AboutSection } from "../AboutSection";
import { ProjectsSection } from "../ProjectsSection";
import { ContactSection } from "../ContactSection";
import { SkillsSection } from "../SkillsSection";

/**
 * Tests de encabezados de sección (Fase 5 — TDD).
 *
 * Valida que las 4 secciones usan el patrón SectionHeader
 * (eyebrow + H2), con los textos correctos y sin el párrafo
 * descriptivo en Habilidades ni en Proyectos (compactación
 * para que el carrusel quepa a la vista).
 */
describe("Encabezados de secciones", () => {
  it("AboutSection usa eyebrow 'Sobre Mí' y su H2", () => {
    render(<AboutSection />);
    expect(screen.getByText("Sobre Mí")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Ingeniería de software bien hecha." }),
    ).toBeInTheDocument();
  });

  it("ProjectsSection usa eyebrow 'Proyectos' y su H2", () => {
    render(<ProjectsSection />);
    expect(screen.getByText("Proyectos")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Casos de estudio seleccionados." }),
    ).toBeInTheDocument();
  });

  it("ContactSection usa eyebrow 'Contacto' y su H2", () => {
    const { container } = render(<ContactSection />);
    const header = container.querySelector("header");
    expect(header).toHaveTextContent("Contacto");
    expect(
      screen.getByRole("heading", { level: 2, name: "Hablemos de tu próximo proyecto." }),
    ).toBeInTheDocument();
  });

  it("SkillsSection usa eyebrow 'Arsenal tech' y su H2", () => {
    render(<SkillsSection />);
    expect(screen.getByText("Arsenal tech")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Herramientas y conocimientos técnicos" }),
    ).toBeInTheDocument();
  });

  it("SkillsSection NO renderiza párrafo descriptivo en el header", () => {
    const { container } = render(<SkillsSection />);
    const header = container.querySelector("header");
    expect(header?.querySelector("p")).toBeNull();
  });

  it("About/Contact conservan su párrafo descriptivo", () => {
    render(<AboutSection />);
    expect(screen.getByText(/Combino la disciplina del backend/)).toBeInTheDocument();
    render(<ContactSection />);
    expect(screen.getByText(/Elige el canal que prefieras/)).toBeInTheDocument();
  });

  it("ProjectsSection NO renderiza párrafo descriptivo en el header", () => {
    const { container } = render(<ProjectsSection />);
    const header = container.querySelector("header");
    expect(header?.querySelector("p")).toBeNull();
  });

  it("ninguna sección usa el patrón numerado 'XX // TÍTULO'", () => {
    for (const Section of [AboutSection, ProjectsSection, ContactSection, SkillsSection]) {
      const { container, unmount } = render(<Section />);
      expect(container.textContent).not.toMatch(/\d{2}\s*\/\//);
      unmount();
    }
  });
});
