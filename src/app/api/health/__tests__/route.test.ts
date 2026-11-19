import { describe, it, expect } from "vitest";
import { GET } from "../route";

/**
 * Tests del endpoint /api/health (Fase 3 — Observabilidad).
 *
 * Valida: estado ok, timestamp ISO, uptime numérico y
 * que no filtra secretos del entorno.
 */
describe("GET /api/health", () => {
  it("responde 200 con status ok", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      status: string;
      timestamp: string;
      uptime: number;
    };
    expect(json.status).toBe("ok");
  });

  it("incluye timestamp ISO válido", async () => {
    const res = await GET();
    const json = (await res.json()) as { timestamp: string };
    expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
  });

  it("incluye uptime numérico ≥ 0", async () => {
    const res = await GET();
    const json = (await res.json()) as { uptime: number };
    expect(typeof json.uptime).toBe("number");
    expect(json.uptime).toBeGreaterThanOrEqual(0);
  });

  it("no expone variables de entorno sensibles", async () => {
    const res = await GET();
    const text = await res.text();
    expect(text).not.toMatch(/SECRET|PASSWORD|API_KEY|TOKEN/i);
  });
});
