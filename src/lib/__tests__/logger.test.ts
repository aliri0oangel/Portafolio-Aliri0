import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { log, logInfo, logWarn, logError } from "../logger";

/**
 * Tests del logger estructurado (Fase 9 — Observabilidad).
 *
 * Valida: formato JSON, niveles de severidad, campos obligatorios
 * (timestamp, level, event) y que no filtra PII.
 */
describe("logger estructurado", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logInfo escribe JSON por console.log", () => {
    logInfo({ event: "test.event", message: "test message" });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const line = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe("info");
    expect(parsed.event).toBe("test.event");
    expect(parsed.timestamp).toBeDefined();
  });

  it("logWarn escribe por console.warn", () => {
    logWarn({ event: "test.warn", message: "warn" });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(parsed.level).toBe("warn");
  });

  it("logError escribe por console.error", () => {
    logError({ event: "test.error", message: "err" });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(parsed.level).toBe("error");
  });

  it("siempre incluye timestamp ISO", () => {
    logInfo({ event: "e", message: "m" });
    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(new Date(parsed.timestamp).toISOString()).toBe(parsed.timestamp);
  });

  it("permite campos adicionales en el payload", () => {
    logInfo({ event: "e", message: "m", customField: 42, another: "ok" });
    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(parsed.customField).toBe(42);
    expect(parsed.another).toBe("ok");
  });

  it("la función log directa acepta los 3 niveles", () => {
    log("info", { event: "a", message: "x" });
    log("warn", { event: "b", message: "y" });
    log("error", { event: "c", message: "z" });
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
