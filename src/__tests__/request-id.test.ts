import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

/**
 * Tests de correlación request-id (Fase 3 — Observabilidad).
 *
 * Cada respuesta debe llevar un `x-request-id` único para correlacionar
 * logs de proxy, rutas API y errores del cliente.
 */
describe("proxy: request-id de correlación", () => {
  function makeRequest(path: string, headers: HeadersInit = {}): NextRequest {
    return new NextRequest(new URL(`http://localhost${path}`), {
      method: "GET",
      headers: new Headers(headers),
    });
  }

  it("genera x-request-id cuando el cliente no lo envía", () => {
    const res = proxy(makeRequest("/"));
    const id = res.headers.get("x-request-id");
    expect(id).toBeTruthy();
    expect(id!.length).toBeGreaterThanOrEqual(8);
  });

  it("reutiliza el x-request-id entrante para correlación", () => {
    const res = proxy(makeRequest("/", { "x-request-id": "corr-abc-123" }));
    expect(res.headers.get("x-request-id")).toBe("corr-abc-123");
  });

  it("genera ids distintos por petición", () => {
    const a = proxy(makeRequest("/")).headers.get("x-request-id");
    const b = proxy(makeRequest("/")).headers.get("x-request-id");
    expect(a).not.toBe(b);
  });

  it("aplica request-id también en respuestas 405 de API", () => {
    const res = proxy(
      new NextRequest(new URL("http://localhost/api/contact"), {
        method: "DELETE",
      }),
    );
    expect(res.status).toBe(405);
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });
});
