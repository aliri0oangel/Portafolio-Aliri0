import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Topbar } from "../Topbar";

/**
 * Fija `window.scrollY` y dispara el evento scroll para alimentar
 * el mini-store de `useScrolled`.
 */
function setScrollY(value: number): void {
  Object.defineProperty(window, "scrollY", {
    writable: true,
    configurable: true,
    value,
  });
  window.dispatchEvent(new Event("scroll"));
}

/**
 * Tests del Topbar (Iteración 6):
 * - Sin badge "Disponible" (redundante con la sección de contacto).
 * - Sin botón "Hablemos" (duplica el enlace "Contacto" del nav).
 * - Sólida por defecto (bg-bg opaco), cristal translúcido al
 *   hacer scroll en cualquier tier de dispositivo.
 */
describe("Topbar", () => {
  afterEach(() => {
    setScrollY(0);
  });

  it("no renderiza el badge 'Disponible'", () => {
    render(<Topbar />);
    expect(screen.queryByText("Disponible")).not.toBeInTheDocument();
  });

  it("no renderiza el enlace 'Hablemos'", () => {
    render(<Topbar />);
    expect(screen.queryByRole("link", { name: "Hablemos" })).not.toBeInTheDocument();
  });

  it("mantiene el ThemeToggle (switch de tema) y la navegación principal", () => {
    render(<Topbar />);
    // Ajuste 18: el conmutador de tema es un interruptor ARIA
    expect(
      screen.getByRole("switch", { name: /cambiar a modo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Navegación principal" }),
    ).toBeInTheDocument();
  });

  it("es sólida arriba y aplica glass al hacer scroll", async () => {
    setScrollY(0);
    const { container } = render(<Topbar />);
    const header = container.querySelector("header");
    expect(header).not.toBeNull();
    expect(header?.className).toContain("bg-bg");
    expect(header?.className).toContain("border-border");
    expect(header?.className).not.toContain("backdrop-blur");

    setScrollY(200);
    await waitFor(() => {
      expect(header?.className).toContain("backdrop-blur-md");
      expect(header?.className).toContain("bg-bg/70");
    });
  });
});

/**
 * Navegación por secciones (fix del scroll al eyebrow):
 * los links hacen preventDefault y scrollean al `data-nav-anchor`
 * (o al tope en "Inicio"), actualizando el hash con replaceState.
 */
describe("Topbar — navegación por secciones", () => {
  let section: HTMLElement;
  let anchor: HTMLElement;
  let scrollIntoViewSpy: ReturnType<typeof vi.fn>;
  let scrollToSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    section = document.createElement("section");
    section.id = "proyectos";
    anchor = document.createElement("header");
    anchor.setAttribute("data-nav-anchor", "");
    section.appendChild(anchor);
    document.body.appendChild(section);

    scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView =
      scrollIntoViewSpy as unknown as typeof Element.prototype.scrollIntoView;
    scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    section.remove();
    scrollToSpy.mockRestore();
    window.history.replaceState(null, "", "/");
    setScrollY(0);
  });

  it("scrollea al header ancla (data-nav-anchor) al clickear 'Proyectos'", async () => {
    const user = userEvent.setup();
    render(<Topbar />);
    await user.click(screen.getByRole("link", { name: "Proyectos" }));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(scrollIntoViewSpy.mock.instances[0]).toBe(anchor);
  });

  it("actualiza el hash con replaceState sin navegar", async () => {
    const user = userEvent.setup();
    render(<Topbar />);
    await user.click(screen.getByRole("link", { name: "Proyectos" }));
    expect(window.location.hash).toBe("#proyectos");
  });

  it("'Inicio' vuelve al tope de la página", async () => {
    const user = userEvent.setup();
    render(<Topbar />);
    await user.click(screen.getByRole("link", { name: "Inicio" }));
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(window.location.hash).toBe("#inicio");
  });

  it("usa behavior 'auto' con prefers-reduced-motion", async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      ...original(query),
      matches: query.includes("prefers-reduced-motion"),
    })) as typeof window.matchMedia;

    const user = userEvent.setup();
    render(<Topbar />);
    await user.click(screen.getByRole("link", { name: "Proyectos" }));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });

    window.matchMedia = original;
  });
});
