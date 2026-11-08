"use client";

import { useSyncExternalStore } from "react";
import type { DeviceTier, IDeviceCapabilities } from "@/types/device";

/**
 * Hook de detección de capacidades de hardware (Adaptive Fidelity Engine).
 *
 * Implementado como un mini-store con `useSyncExternalStore` — patrón
 * sancionado por React para sincronizar estado con sistemas externos
 * (Network Information API, Battery API, Media Queries) sin efectos que
 * hagan `setState` durante el render.
 *
 * El servidor asume capacidades altas (sin APIs de navegador); tras la
 * hidratación React recalibra con el snapshot del cliente sin producir
 * hydration mismatch.
 */

/** Snapshot por defecto usado en el servidor (SSR). */
const SERVER_CAPABILITIES: IDeviceCapabilities = {
  deviceMemory: 8,
  hardwareConcurrency: 8,
  saveData: false,
  effectiveType: "4g",
  prefersReducedMotion: false,
  batteryLevel: null,
};

const listeners = new Set<() => void>();

/** Nivel de batería actualizado por la Battery API (si existe). */
let batteryLevel: number | null = null;

/** Snapshot cacheado: `useSyncExternalStore` exige identidad estable. */
let cachedCapabilities: IDeviceCapabilities | null = null;

let detachSystemListeners: (() => void) | null = null;

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

function collectCapabilities(): IDeviceCapabilities {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  return {
    deviceMemory: nav.deviceMemory ?? 8,
    hardwareConcurrency: nav.hardwareConcurrency ?? 8,
    saveData: nav.connection?.saveData ?? false,
    effectiveType: nav.connection?.effectiveType ?? "4g",
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    batteryLevel,
  };
}

function getSnapshot(): IDeviceCapabilities {
  if (!cachedCapabilities) cachedCapabilities = collectCapabilities();
  return cachedCapabilities;
}

function getServerSnapshot(): IDeviceCapabilities {
  return SERVER_CAPABILITIES;
}

/**
 * Mínimo de la Battery API necesario para detectar nivel de batería.
 * TS no incluye la Battery API en `Navigator`, por lo que se declara aquí.
 */
interface BatteryManagerLike {
  level: number;
  addEventListener(type: "levelchange", listener: () => void): void;
  removeEventListener(type: "levelchange", listener: () => void): void;
}

/**
 * Adjunta los listeners del sistema (red, batería, movimiento reducido)
 * solo mientras haya al menos un suscriptor; se limpian al desmontar.
 */
function attachSystemListeners(): void {
  const nav = navigator as Navigator & {
    connection?: {
      saveData?: boolean;
      effectiveType?: string;
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    };
    getBattery?: () => Promise<BatteryManagerLike>;
  };

  const invalidate = () => {
    cachedCapabilities = null;
    notifyListeners();
  };

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionQuery.addEventListener("change", invalidate);
  nav.connection?.addEventListener?.("change", invalidate);

  let detachBattery: (() => void) | null = null;

  // La batería es opcional (no disponible en Firefox/Safari desktop).
  nav.getBattery?.().then((battery) => {
    if (!listeners.size) return;

    const onLevelChange = () => {
      batteryLevel = battery.level;
      cachedCapabilities = null;
      notifyListeners();
    };

    batteryLevel = battery.level;
    cachedCapabilities = null;
    battery.addEventListener("levelchange", onLevelChange);
    notifyListeners();

    detachBattery = () => battery.removeEventListener("levelchange", onLevelChange);
  });

  detachSystemListeners = () => {
    motionQuery.removeEventListener("change", invalidate);
    nav.connection?.removeEventListener?.("change", invalidate);
    detachBattery?.();
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) attachSystemListeners();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      detachSystemListeners?.();
      detachSystemListeners = null;
    }
  };
}

/**
 * Detecta las capacidades del dispositivo y asigna un nivel de fidelidad.
 *
 * @returns Capabilidades detectadas y el tier activo (`high`/`mid`/`low`).
 */
export function useDeviceTier(): { tier: DeviceTier; capabilities: IDeviceCapabilities } {
  const capabilities = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { tier: computeDeviceTier(capabilities), capabilities };
}

/**
 * Función pura que traduce capacidades crudas en un tier de fidelidad.
 * Separada del hook para poder testearla sin DOM.
 *
 * Reglas (en orden de severidad):
 * 1. Tier 3 si: red 2g/3g, saveData, memoria < 4GB, pocos núcleos,
 *    batería < 20% o `prefers-reduced-motion`.
 * 2. Tier 1 si: memoria ≥ 8GB y núcleos ≥ 8.
 * 3. En cualquier otro caso → Tier 2.
 *
 * @param caps - Captura de capacidades del dispositivo.
 * @returns Nivel de fidelidad asignado.
 */
export function computeDeviceTier(caps: IDeviceCapabilities): DeviceTier {
  const slowNetwork = caps.effectiveType === "2g" || caps.effectiveType === "3g";
  const lowBattery = caps.batteryLevel !== null && caps.batteryLevel < 0.2;

  const isLow =
    slowNetwork ||
    caps.saveData ||
    caps.deviceMemory < 4 ||
    caps.hardwareConcurrency <= 4 ||
    lowBattery ||
    caps.prefersReducedMotion;

  if (isLow) return "low";

  if (caps.deviceMemory >= 8 && caps.hardwareConcurrency >= 8) return "high";

  return "mid";
}
