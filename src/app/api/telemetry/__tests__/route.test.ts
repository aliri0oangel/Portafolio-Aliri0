import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "../route";

/**
 * Tests del endpoint /api/telemetry (Fase 3 — RUM liviano propio).
 *
 * Valida: aceptación de métricas válidas, rechazo de payloads
 * inválidos (400/422), 405 en GET, rate limit y ausencia de PII
 * en el log estructurado.
 */
describe("POST /api/telemetry", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  function makeRequest(body: unknown, ip = "10.0.0.1"): NextRequest {
    return new NextRequest(new URL("http://localhost/api/telemetry"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify(body),
    });
  }

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("acepta un batch de métricas válidas con 200", async () => {
    const res = await POST(
      makeRequest({
        events: [
          { name: "LCP", value: 1200, rating: "good" },
          { name: "CLS", value: 0.05, rating: "good" },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
  });

  it("registra evento estructurado sin PII", async () => {
    await POST(
      makeRequest({
        events: [{ name: "INP", value: 48, rating: "good" }],
      }),
    );
    expect(logSpy).toHaveBeenCalled();
    const line = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line) as { event: string };
    expect(parsed.event).toBe("telemetry.received");
    expect(line).not.toMatch(/@/);
  });

  it("rechaza body no JSON con 400", async () => {
    const req = new NextRequest(new URL("http://localhost/api/telemetry"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rechaza events ausentes o vacíos con 422", async () => {
    const res = await POST(makeRequest({ events: [] }));
    expect(res.status).toBe(422);
    const res2 = await POST(makeRequest({}));
    expect(res2.status).toBe(422);
  });

  it("rechaza eventos con value no numérico con 422", async () => {
    const res = await POST(
      makeRequest({ events: [{ name: "LCP", value: "fast" }] }),
    );
    expect(res.status).toBe(422);
  });

  it("rechaza más de 20 eventos por batch con 422", async () => {
    const events = Array.from({ length: 21 }, (_, i) => ({
      name: "LCP",
      value: i,
    }));
    const res = await POST(makeRequest({ events }));
    expect(res.status).toBe(422);
  });

  it("aplica rate limit por IP tras agotar la cuota", async () => {
    // Cuota RUM: 60 batches / 5 min por IP — agotar la 61ra
    const ip = `ratelimit-${Date.now()}`;
    let lastStatus = 0;
    for (let i = 0; i < 65; i++) {
      const res = await POST(
        makeRequest({ events: [{ name: "TTFB", value: 100 }] }, ip),
      );
      lastStatus = res.status;
      if (res.status === 429) break;
    }
    expect(lastStatus).toBe(429);
  });

  it("GET responde 405", () => {
    const res = GET();
    expect(res.status).toBe(405);
  });
});
