import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { WebVitals } from "../WebVitals";

/**
 * Tests del componente RUM (Fase 3 — Observabilidad liviana).
 *
 * Valida: montaje sin render visible y que el hook de Next
 * quede registrado (mockeado) para reportar métricas.
 */

/** Métrica simulada con la forma de next/web-vitals. */
const fakeMetric = {
  name: "LCP",
  value: 1500,
  id: "v1-test",
  rating: "good" as const,
  navigationType: "navigate",
};

/** Captura el callback que el layout le pasa a useReportWebVitals. */
const capturedCallbacks: Array<(m: typeof fakeMetric) => void> = [];

vi.mock("next/web-vitals", () => ({
  useReportWebVitals: (cb: (m: typeof fakeMetric) => void) => {
    capturedCallbacks.push(cb);
  },
}));

vi.mock("@/lib/telemetry/client", () => ({
  sendTelemetry: vi.fn(),
  isTelemetryEnabled: () => true,
}));

import { sendTelemetry } from "@/lib/telemetry/client";

describe("WebVitals (RUM)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    capturedCallbacks.length = 0;
  });

  it("monta sin renderizar contenido visible", () => {
    const { container } = render(<WebVitals />);
    expect(container.innerHTML).toBe("");
  });

  it("registra el callback de useReportWebVitals una sola vez", () => {
    render(<WebVitals />);
    expect(capturedCallbacks).toHaveLength(1);
  });

  it("al reportar una métrica la envía a sendTelemetry", () => {
    render(<WebVitals />);
    capturedCallbacks[0](fakeMetric);
    expect(sendTelemetry).toHaveBeenCalledWith([
      {
        name: "LCP",
        value: 1500,
        id: "v1-test",
        rating: "good",
        navigationType: "navigate",
      },
    ]);
  });
});
