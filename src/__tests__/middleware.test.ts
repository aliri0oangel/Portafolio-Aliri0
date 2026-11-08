import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

/**
 * Tests del middleware de seguridad (Fase 7 — OWASP A01/A05/A06).
 *
 * Valida: headers de seguridad presentes, bloqueo de métodos
 * no permitidos en /api/*, y passthrough para GET/POST.
 */

/** Crea un NextRequest mock para pruebas. */
function makeRequest(path: string, method: string = "GET"): NextRequest {
  const headers = new Headers();
  return new NextRequest(new URL(`http://localhost${path}`), { method, headers });
}

describe("middleware de seguridad", () => {
  it("aplica Content-Security-Policy", () => {
    const response = proxy(makeRequest("/"));
    expect(response.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
  });

  it("aplica X-Frame-Options: DENY", () => {
    const response = proxy(makeRequest("/"));
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("aplica X-Content-Type-Options: nosniff", () => {
    const response = proxy(makeRequest("/"));
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("aplica HSTS", () => {
    const response = proxy(makeRequest("/"));
    expect(response.headers.get("Strict-Transport-Security")).toContain("max-age=");
  });

  it("aplica Referrer-Policy", () => {
    const response = proxy(makeRequest("/"));
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("aplica Permissions-Policy bloqueando cámara/micrófono", () => {
    const response = proxy(makeRequest("/"));
    const pp = response.headers.get("Permissions-Policy");
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
  });

  it("permite GET en /api/*", () => {
    const response = proxy(makeRequest("/api/contact", "GET"));
    expect(response.status).not.toBe(405);
  });

  it("permite POST en /api/*", () => {
    const response = proxy(makeRequest("/api/contact", "POST"));
    expect(response.status).not.toBe(405);
  });

  it("bloquea DELETE en /api/* con 405", () => {
    const response = proxy(makeRequest("/api/contact", "DELETE"));
    expect(response.status).toBe(405);
  });

  it("bloquea PUT en /api/* con 405", () => {
    const response = proxy(makeRequest("/api/contact", "PUT"));
    expect(response.status).toBe(405);
  });

  it("bloquea PATCH en /api/* con 405", () => {
    const response = proxy(makeRequest("/api/contact", "PATCH"));
    expect(response.status).toBe(405);
  });
});
