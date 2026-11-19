import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

/**
 * Tests de verificación de origen (Fase 4 — OWASP A01/CSRF).
 *
 * El endpoint de contacto solo acepta requests cuyo `Origin`
 * coincide con el host del sitio (o `sec-fetch-site: same-origin`).
 * Requests cross-origin (CSRF clásico) reciben 403.
 */
describe("POST /api/contact — origin check (CSRF)", () => {
  let logWarnSpy: ReturnType<typeof vi.spyOn>;

  function makeRequest(headers: Record<string, string>): NextRequest {
    return new NextRequest(new URL("http://localhost/api/contact"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `origin-${Date.now()}-${Math.random()}`,
        ...headers,
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        subject: "Consulta General",
        message: "Mensaje de prueba suficientemente largo.",
      }),
    });
  }

  beforeEach(() => {
    logWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rechaza Origin cross-origin con 403", async () => {
    const res = await POST(
      makeRequest({ origin: "https://evil.example.com" }),
    );
    expect(res.status).toBe(403);
  });

  it("rechaza Origin null (sandbox/iframes) con 403", async () => {
    const res = await POST(makeRequest({ origin: "null" }));
    expect(res.status).toBe(403);
  });

  it("acepta Origin same-origin (localhost en dev)", async () => {
    const res = await POST(makeRequest({ origin: "http://localhost" }));
    // No debe ser 403 por origen (puede fallar por rate limit u otro, pero no 403)
    expect(res.status).not.toBe(403);
  });

  it("acepta Origin que coincide con el host de la petición", async () => {
    const res = await POST(makeRequest({ origin: "http://localhost" }));
    expect(res.status).not.toBe(403);
  });

  it("acepta sin Origin pero con sec-fetch-site: same-origin (fetch moderno)", async () => {
    const res = await POST(
      makeRequest({ "sec-fetch-site": "same-origin" }),
    );
    expect(res.status).not.toBe(403);
  });

  it("acepta sin Origin ni sec-fetch (curl/scripts legítimos con rate limit)", async () => {
    // Sin headers de navegador: se acepta (rate limit sigue aplicando).
    // El CSRF real de browser siempre envía Origin o sec-fetch-*.
    const res = await POST(makeRequest({}));
    expect(res.status).not.toBe(403);
  });

  it("rechaza sec-fetch-site: cross-site con 403", async () => {
    const res = await POST(
      makeRequest({ "sec-fetch-site": "cross-site" }),
    );
    expect(res.status).toBe(403);
  });

  it("loguea evento contact.origin_rejected sin PII", async () => {
    await POST(makeRequest({ origin: "https://evil.example.com" }));
    expect(logWarnSpy).toHaveBeenCalled();
    const line = logWarnSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line) as { event: string };
    expect(parsed.event).toBe("contact.origin_rejected");
    expect(line).not.toMatch(/@/);
  });
});
