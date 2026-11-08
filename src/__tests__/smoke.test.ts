import { describe, it, expect } from "vitest";

/**
 * Smoke test: valida que la infraestructura de Vitest + jsdom
 * + Testing Library funciona correctamente (Fase 0).
 */
describe("Infraestructura TDD", () => {
  it("ejecuta aserciones básicas", () => {
    expect(1 + 1).toBe(2);
  });

  it("jsdom está activo (existe window)", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
  });
});
