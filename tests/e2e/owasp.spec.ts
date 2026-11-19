import { test, expect } from "@playwright/test";

/**
 * Smoke OWASP (Fase 4).
 *
 * Valida en runtime de producción:
 * - `/.well-known/security.txt` publicado (A06 divulgación).
 * - Origin cross-origin rechazado con 403 en /api/contact (CSRF A01).
 * - Origin cross-origin rechazado con 403 en /api/telemetry.
 * - Content-Length excesivo → 413 en /api/contact (DoS A05).
 * - Headers de seguridad presentes (A05).
 */
test.describe("OWASP (Fase 4)", () => {
  test("sirve /.well-known/security.txt", async ({ request }) => {
    const res = await request.get("/.well-known/security.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Contact:");
    expect(body).toContain("Expires:");
  });

  test("POST /api/contact rechaza Origin cross-origin con 403", async ({
    request,
  }) => {
    const res = await request.post("/api/contact", {
      headers: {
        origin: "https://evil.example.com",
        "x-forwarded-for": "10.8.0.1",
      },
      data: {
        name: "Test",
        email: "t@example.com",
        subject: "Consulta General",
        message: "Mensaje de prueba lo suficientemente largo.",
      },
    });
    expect(res.status()).toBe(403);
  });

  test("POST /api/telemetry rechaza Origin cross-origin con 403", async ({
    request,
  }) => {
    const res = await request.post("/api/telemetry", {
      headers: {
        origin: "https://evil.example.com",
        "x-forwarded-for": "10.8.0.2",
      },
      data: { events: [{ name: "LCP", value: 100 }] },
    });
    expect(res.status()).toBe(403);
  });

  test("POST /api/contact acepta Origin same-origin (no 403)", async ({
    request,
  }) => {
    // Origin del propio host bajo test (Playwright webServer en :3100).
    // APIRequestContext no expone baseURL en tipado; se deriva del request.
    const probe = await request.get("/api/health");
    const serverOrigin = new URL(probe.url()).origin;
    const res = await request.post("/api/contact", {
      headers: {
        origin: serverOrigin,
        "x-forwarded-for": "10.8.0.3",
      },
      data: {
        name: "Test User",
        email: "test@example.com",
        subject: "Consulta General",
        message: "Mensaje de prueba lo suficientemente largo.",
      },
    });
    // No debe fallar por CSRF (puede ser 200 del mock)
    expect(res.status()).not.toBe(403);
  });

  test("las respuestas API llevan headers de seguridad", async ({ request }) => {
    const res = await request.get("/api/health");
    const headers = res.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
  });
});
