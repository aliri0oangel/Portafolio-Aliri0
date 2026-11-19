import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import GlobalError from "../global-error";

/**
 * Tests del error boundary global (Fase 3 — Observabilidad).
 *
 * `global-error.tsx` reemplaza el root layout cuando hay un error
 * fatal: debe incluir sus propios <html>/<body>, loguear el error
 * con el logger estructurado y ofrecer recuperación.
 */
describe("global-error", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza sus propios <html> y <body> (contrato Next.js)", () => {
    const html = renderToString(
      <GlobalError error={new Error("boom")} reset={() => {}} />,
    );
    expect(html).toContain("<html");
    expect(html).toContain("<body");
  });

  it("muestra mensaje de error recuperable", () => {
    const html = renderToString(
      <GlobalError error={new Error("boom")} reset={() => {}} />,
    );
    expect(html).toContain("Algo salió mal");
    expect(html).toContain("Reintentar");
  });

  it("no filtra el mensaje crudo del error en producción al cliente", () => {
    // En producción Next serializa; el componente no debe imprimir
    // error.message directamente (solo digiere el objeto).
    const html = renderToString(
      <GlobalError
        error={new Error("SQL connection failed at /secret")}
        reset={() => {}}
      />,
    );
    expect(html).not.toContain("SQL connection failed");
    expect(html).not.toContain("/secret");
  });
});
