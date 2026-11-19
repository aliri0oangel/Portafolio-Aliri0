import { NextResponse } from "next/server";
import type { HealthResponse } from "@/types/telemetry";

/**
 * GET /api/health — sonda de salud del servicio (Fase 3).
 *
 * Uso: uptime monitors (UptimeRobot, BetterStack) y smoke tests.
 * No expone variables de entorno ni detalles internos (A05).
 *
 * @returns 200 con status, timestamp ISO y uptime en segundos.
 */
export function GET() {
  const payload: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
  return NextResponse.json<HealthResponse>(payload);
}
