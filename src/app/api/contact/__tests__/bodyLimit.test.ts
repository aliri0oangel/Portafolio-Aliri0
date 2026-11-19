import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

/**
 * Tests de límite de tamaño de cuerpo (Fase 4 — OWASP A05/DoS).
 *
 * Requests con Content-Length por encima del máximo permitido
 * se rechazan con 413 antes de parsear el JSON completo.
 */
describe("POST /api/contact — límite de Content-Length", () => {
  const MAX_BYTES = 32 * 1024; // 32 KB — el form real es < 2 KB

  function makeOversizedRequest(contentLength: number): NextRequest {
    return new NextRequest(new URL("http://localhost/api/contact"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(contentLength),
        "x-forwarded-for": `size-${Date.now()}`,
        origin: "http://localhost",
      },
      body: JSON.stringify({}),
    });
  }

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rechaza Content-Length > 32KB con 413", async () => {
    const res = await POST(makeOversizedRequest(MAX_BYTES + 1));
    expect(res.status).toBe(413);
  });

  it("acepta Content-Length dentro del límite (no 413)", async () => {
    const res = await POST(makeOversizedRequest(1024));
    expect(res.status).not.toBe(413);
  });
});
