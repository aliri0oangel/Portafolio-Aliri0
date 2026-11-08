import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArchitectureShowcase } from "../ArchitectureShowcase";

/**
 * Tests del ArchitectureShowcase (Iteración 6 — suite recreada en
 * el revert del DataFlowCard; el archivo original era untracked).
 *
 * Valida: cabecera estilo ventana, tablist accesible con 3
 * categorías, cambio de pestañas, items del panel activo y
 * LocalClock integrado en el pie.
 */
describe("ArchitectureShowcase", () => {
  it("muestra la cabecera con los semáforos y el label stack.production", () => {
    render(<ArchitectureShowcase />);
    expect(screen.getByText("stack.production")).toBeInTheDocument();
  });

  it("renderiza el tablist con las 3 categorías del stack", () => {
    render(<ArchitectureShowcase />);
    const tablist = screen.getByRole("tablist", { name: "Categorías del stack" });
    expect(within(tablist).getByRole("tab", { name: "Frontend" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Backend & CMS" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "DevOps" })).toBeInTheDocument();
  });

  it("Frontend está seleccionada por defecto y muestra sus items", () => {
    render(<ArchitectureShowcase />);
    expect(screen.getByRole("tab", { name: "Frontend" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Next.js 15")).toBeInTheDocument();
    expect(screen.getByText("React 19")).toBeInTheDocument();
  });

  it("al elegir Backend & CMS muestra sus items", async () => {
    const user = userEvent.setup();
    render(<ArchitectureShowcase />);
    await user.click(screen.getByRole("tab", { name: "Backend & CMS" }));
    // AnimatePresence mode="wait": el panel nuevo monta tras el exit (0.18s)
    expect(await screen.findByText("WordPress Headless")).toBeInTheDocument();
    expect(await screen.findByText("REST / GraphQL")).toBeInTheDocument();
  });

  it("al elegir DevOps muestra sus items", async () => {
    const user = userEvent.setup();
    render(<ArchitectureShowcase />);
    await user.click(screen.getByRole("tab", { name: "DevOps" }));
    expect(await screen.findByText("Vercel Edge")).toBeInTheDocument();
    expect(await screen.findByText("GitHub Actions")).toBeInTheDocument();
  });

  it("cada pestaña activa renderiza exactamente 4 items", async () => {
    const user = userEvent.setup();
    render(<ArchitectureShowcase />);
    const panel = screen.getByRole("tabpanel");
    expect(panel.querySelectorAll("li").length).toBe(4);
    await user.click(screen.getByRole("tab", { name: "DevOps" }));
    expect(screen.getByRole("tabpanel").querySelectorAll("li").length).toBe(4);
  });

  it("actualiza aria-selected al cambiar de pestaña", async () => {
    const user = userEvent.setup();
    render(<ArchitectureShowcase />);
    await user.click(screen.getByRole("tab", { name: "DevOps" }));
    expect(screen.getByRole("tab", { name: "DevOps" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Frontend" })).toHaveAttribute("aria-selected", "false");
  });

  it("el panel activo etiqueta su categoría (aria-label)", async () => {
    const user = userEvent.setup();
    render(<ArchitectureShowcase />);
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-label", "Frontend");
    await user.click(screen.getByRole("tab", { name: "Backend & CMS" }));
    expect(
      await screen.findByRole("tabpanel", { name: "Backend & CMS" }),
    ).toBeInTheDocument();
  });

  it("muestra el LocalClock integrado en el pie del showcase (Iteración 6)", () => {
    render(<ArchitectureShowcase />);
    expect(screen.getByText("Zona horaria local")).toBeInTheDocument();
    expect(screen.getByText("UTC-4")).toBeInTheDocument();
  });
});
