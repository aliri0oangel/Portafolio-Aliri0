import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sendTelemetry,
  isTelemetryEnabled,
  __flushTelemetryForTests,
  __resetTelemetryForTests,
} from "../client";
import type { TelemetryEvent } from "@/types/telemetry";

/**
 * Tests del cliente de telemetría (Fase 3 — RUM liviano propio).
 *
 * Valida: buffering + envío vía sendBeacon/fetch, inhabilitación
 * en SSR, descarte de payloads inválidos y ausencia de PII.
 */
describe("telemetry client", () => {
  let beaconSpy: ReturnType<typeof vi.fn>;
  let fetchSpy: ReturnType<typeof vi.fn>;

  const validEvent: TelemetryEvent = {
    name: "LCP",
    value: 1200,
    id: "v1-abc",
    rating: "good",
  };

  beforeEach(() => {
    beaconSpy = vi.fn().mockReturnValue(true);
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    Object.defineProperty(navigator, "sendBeacon", {
      writable: true,
      configurable: true,
      value: beaconSpy,
    });
    Object.defineProperty(window, "fetch", {
      writable: true,
      configurable: true,
      value: fetchSpy,
    });
    __resetTelemetryForTests();
  });

  afterEach(() => {
    __resetTelemetryForTests();
    vi.restoreAllMocks();
  });

  it("isTelemetryEnabled es true en navegador y false en SSR", () => {
    expect(isTelemetryEnabled()).toBe(true);
    const original = globalThis.window;
    Reflect.deleteProperty(globalThis, "window");
    expect(isTelemetryEnabled()).toBe(false);
    Object.defineProperty(globalThis, "window", {
      writable: true,
      configurable: true,
      value: original,
    });
  });

  it("no envía de inmediato: acumula en buffer hasta el flush", () => {
    sendTelemetry([validEvent]);
    expect(beaconSpy).not.toHaveBeenCalled();
    __flushTelemetryForTests();
    expect(beaconSpy).toHaveBeenCalledTimes(1);
  });

  it("agrupa múltiples métricas en un solo POST (batching)", () => {
    sendTelemetry([{ name: "LCP", value: 100 }]);
    sendTelemetry([{ name: "CLS", value: 0.01 }]);
    sendTelemetry([{ name: "INP", value: 40 }]);
    __flushTelemetryForTests();
    expect(beaconSpy).toHaveBeenCalledTimes(1);
    const body = beaconSpy.mock.calls[0][1] as string;
    const parsed = JSON.parse(body) as { events: TelemetryEvent[] };
    expect(parsed.events).toHaveLength(3);
    expect(parsed.events.map((e) => e.name)).toEqual(["LCP", "CLS", "INP"]);
  });

  it("despacha a /api/telemetry con sendBeacon", () => {
    sendTelemetry([validEvent]);
    __flushTelemetryForTests();
    expect(beaconSpy.mock.calls[0][0]).toBe("/api/telemetry");
  });

  it("no envía si la lista de eventos está vacía", () => {
    sendTelemetry([]);
    __flushTelemetryForTests();
    expect(beaconSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("no envía eventos con nombre vacío o value no numérico", () => {
    sendTelemetry([
      { name: "", value: 100 },
      { name: "CLS", value: Number.NaN },
    ]);
    __flushTelemetryForTests();
    expect(beaconSpy).not.toHaveBeenCalled();
  });

  it("usa fetch keepalive como fallback si sendBeacon no existe", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      writable: true,
      configurable: true,
      value: undefined,
    });
    sendTelemetry([validEvent]);
    __flushTelemetryForTests();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/telemetry",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("no incluye PII (email, ip, user agent crudo) en el payload", () => {
    sendTelemetry([validEvent]);
    __flushTelemetryForTests();
    const body = beaconSpy.mock.calls[0][1] as string;
    expect(body).not.toMatch(/@/);
    expect(body.toLowerCase()).not.toContain("user-agent");
    expect(body.toLowerCase()).not.toContain("email");
  });

  it("divide en sub-lotes si el buffer supera MAX_BATCH (20)", () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      name: "LCP",
      value: i,
    }));
    sendTelemetry(many);
    __flushTelemetryForTests();
    expect(beaconSpy).toHaveBeenCalledTimes(2);
    const first = JSON.parse(beaconSpy.mock.calls[0][1] as string) as {
      events: unknown[];
    };
    const second = JSON.parse(beaconSpy.mock.calls[1][1] as string) as {
      events: unknown[];
    };
    expect(first.events).toHaveLength(20);
    expect(second.events).toHaveLength(5);
  });
});
