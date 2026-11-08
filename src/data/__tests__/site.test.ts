import { describe, it, expect } from "vitest";
import { navLinks } from "../site";

/**
 * Tests de datos de navegación (Fase 4 — TDD).
 *
 * Garantiza que navLinks ya no expone campo `number` y mantiene
 * los 5 items con ids/labels correctos.
 */
describe("navLinks", () => {
  it("tiene exactamente 5 entradas", () => {
    expect(navLinks).toHaveLength(5);
  });

  it("no expone campo number", () => {
    for (const link of navLinks) {
      expect(link).not.toHaveProperty("number");
    }
  });

  it("los ids y labels son los esperados", () => {
    expect(navLinks.map((l) => l.id)).toEqual([
      "inicio", "sobre-mi", "habilidades", "proyectos", "contacto",
    ]);
    expect(navLinks.map((l) => l.label)).toEqual([
      "Inicio", "Sobre Mí", "Habilidades", "Proyectos", "Contacto",
    ]);
  });
});
