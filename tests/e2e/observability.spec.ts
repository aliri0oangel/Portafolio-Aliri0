import { test, expect } from "@playwright/test";

/**
 * Smoke de observabilidad (Fase 3).
 *
 * Valida en runtime (build de producción vía webServer de Playwright):
 * - GET /api/health responde ok con timestamp.
 * - POST /api/telemetry acepta un batch válido y lo registra.
 * - POST /api/telemetry rechaza payload inválido con 422.
 * - Toda respuesta API lleva x-request-id (correlación).
 *
 * Nota: cada request lleva un `x-forwarded-for` único para aislar
 * el rate limit in-memory entre specs (misma IP = cuota compartida).
 */
test.describe("Observabilidad (Fase 3)", () => {
  /** IP única por test para no agotar la cuota de rate limit. */
  let ipCounter = 0;
  function uniqueIp(): string {
    ipCounter += 1;
    return `10.9.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
  }

  test("GET /api/health responde ok con timestamp ISO", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const json = (await res.json()) as {
      status: string;
      timestamp: string;
      uptime: number;
    };
    expect(json.status).toBe("ok");
    expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
    expect(json.uptime).toBeGreaterThanOrEqual(0);
  });

  test("POST /api/telemetry acepta un batch válido", async ({ request }) => {
    const res = await request.post("/api/telemetry", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: {
        events: [
          { name: "LCP", value: 1400, rating: "good" },
          { name: "CLS", value: 0.02, rating: "good" },
        ],
      },
    });
    expect(res.status()).toBe(200);
    const json = (await res.json()) as { ok: boolean; accepted: number };
    expect(json.ok).toBe(true);
    expect(json.accepted).toBe(2);
  });

  test("POST /api/telemetry rechaza payload inválido con 422", async ({
    request,
  }) => {
    const res = await request.post("/api/telemetry", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { events: [] },
    });
    expect(res.status()).toBe(422);
  });

  test("las respuestas API llevan x-request-id", async ({ request }) => {
    const res = await request.get("/api/health");
    const id = res.headers()["x-request-id"];
    expect(id).toBeTruthy();
    expect(id!.length).toBeGreaterThanOrEqual(8);
  });

  test("el request-id entrante se reutiliza para correlación", async ({
    request,
  }) => {
    const res = await request.get("/api/health", {
      headers: { "x-request-id": "corr-e2e-42" },
    });
    expect(res.headers()["x-request-id"]).toBe("corr-e2e-42");
  });

  test("GET /api/telemetry devuelve 405", async ({ request }) => {
    const res = await request.get("/api/telemetry");
    expect(res.status()).toBe(405);
  });
});
