import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createRateLimiter,
  rateLimit,
  rateLimitAsync,
  pruneExpiredEntries,
} from "../rateLimiter";

/**
 * Tests del factory del rate limiter (Fase 4 — OWASP A04).
 *
 * En serverless multi-instancia (Vercel) el in-memory se pierde
 * entre cold starts; cuando existan UPSTASH_*_URL/TOKEN, el
 * factory debe poder inyectar un backend Redis sin cambiar callers.
 */
describe("rateLimiter — factory DIP (Upstash-ready)", () => {
  beforeEach(() => {
    pruneExpiredEntries();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("createRateLimiter siempre devuelve un objeto con check()", () => {
    const limiter = createRateLimiter();
    expect(typeof limiter.check).toBe("function");
    expect(typeof limiter.checkAsync).toBe("function");
  });

  it("sin UPSTASH_* usa el backend in-memory por defecto", () => {
    const limiter = createRateLimiter();
    const key = `factory-${Date.now()}`;
    expect(limiter.check(key).allowed).toBe(true);
    const second = limiter.check(key, 1, 60_000);
    expect(second.allowed).toBe(false);
  });

  it("rateLimit() delega en createRateLimiter (misma interfaz)", () => {
    const key = `delegate-${Date.now()}`;
    expect(rateLimit(key).allowed).toBe(true);
    expect(rateLimit(key).allowed).toBe(true);
    expect(rateLimit(key).allowed).toBe(true);
    expect(rateLimit(key).allowed).toBe(false);
  });

  it("rateLimitAsync resuelve con in-memory sin UPSTASH_*", async () => {
    const key = `async-${Date.now()}`;
    expect((await rateLimitAsync(key)).allowed).toBe(true);
    expect((await rateLimitAsync(key)).allowed).toBe(true);
    expect((await rateLimitAsync(key)).allowed).toBe(true);
    expect((await rateLimitAsync(key)).allowed).toBe(false);
  });

  it("con UPSTASH_* configurado usa el backend remoto (fetch llamado)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: [1, 60000] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const limiter = createRateLimiter();
    const result = await limiter.checkAsync("upstash-key", 3, 60_000);
    expect(result.allowed).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://example.upstash.io/eval",
    );
  });

  it("si Upstash falla (red), degrada a in-memory (fail-open)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const limiter = createRateLimiter();
    const key = `fallback-${Date.now()}`;
    // Fail-open: no lanza, resuelve con in-memory
    expect((await limiter.checkAsync(key)).allowed).toBe(true);
    expect((await limiter.checkAsync(key)).allowed).toBe(true);
    expect((await limiter.checkAsync(key)).allowed).toBe(true);
    expect((await limiter.checkAsync(key)).allowed).toBe(false);
  });
});
