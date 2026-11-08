import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimit, pruneExpiredEntries, createRateLimiter } from "../rateLimiter";

/**
 * Tests del rate limiter (Fase 7 — OWASP A04).
 *
 * Valida: cuota por ventana, bloqueo tras exceder, liberación
 * al expirar la ventana, y cumplimiento del contrato IRateLimiter.
 */
describe("rateLimiter", () => {
  beforeEach(() => {
    pruneExpiredEntries();
    vi.useRealTimers();
  });

  it("permite la primera petición", () => {
    const result = rateLimit("ip-test-1");
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
  });

  it("permite hasta 3 peticiones y bloquea la 4ta", () => {
    expect(rateLimit("ip-test-2").allowed).toBe(true);
    expect(rateLimit("ip-test-2").allowed).toBe(true);
    expect(rateLimit("ip-test-2").allowed).toBe(true);
    const fourth = rateLimit("ip-test-2");
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterMs).toBeGreaterThan(0);
  });

  it("las IPs son independientes", () => {
    for (let i = 0; i < 3; i++) rateLimit("ip-a");
    expect(rateLimit("ip-a").allowed).toBe(false);
    expect(rateLimit("ip-b").allowed).toBe(true);
  });

  it("libera la ventana cuando expira (resetAt)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    for (let i = 0; i < 3; i++) rateLimit("ip-c");
    expect(rateLimit("ip-c").allowed).toBe(false);
    // Avanzamos 16 minutos (> WINDOW_MS de 15 min)
    vi.advanceTimersByTime(16 * 60 * 1000);
    expect(rateLimit("ip-c").allowed).toBe(true);
    vi.useRealTimers();
  });

  it("createRateLimiter cumple el contrato IRateLimiter (DIP)", () => {
    const limiter = createRateLimiter();
    expect(typeof limiter.check).toBe("function");
    const result = limiter.check("ip-dip");
    expect(result).toHaveProperty("allowed");
    expect(result).toHaveProperty("retryAfterMs");
  });

  it("pruneExpiredEntries elimina entradas vencidas", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    rateLimit("ip-prune");
    vi.advanceTimersByTime(16 * 60 * 1000);
    pruneExpiredEntries();
    // Tras purgar, la clave debe empezar de nuevo (allowed=true)
    expect(rateLimit("ip-prune").allowed).toBe(true);
    vi.useRealTimers();
  });
});
