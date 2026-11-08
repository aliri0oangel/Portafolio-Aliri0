import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNav } from "../MobileNav";

/**
 * Tests del menú móvil: la navegación delega en `onNavigate` con
 * preventDefault (sin salto nativo duplicado) y cierra el diálogo.
 */
describe("MobileNav", () => {
  const baseProps = {
    open: true,
    onClose: vi.fn(),
    activeSection: "inicio",
    onNavigate: vi.fn(),
  };

  it("al clickear un link llama a onNavigate con el id y cierra el menú", async () => {
    const onClose = vi.fn();
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<MobileNav {...baseProps} onClose={onClose} onNavigate={onNavigate} />);

    await user.click(screen.getByRole("link", { name: "Proyectos" }));
    expect(onNavigate).toHaveBeenCalledWith("proyectos");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("mantiene el diálogo accesible con role y aria-modal", () => {
    render(<MobileNav {...baseProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("marca la sección activa con aria-current implícito (clase de superficie)", () => {
    render(<MobileNav {...baseProps} activeSection="proyectos" />);
    const link = screen.getByRole("link", { name: "Proyectos" });
    expect(link.className).toContain("bg-surface-2");
  });
});
