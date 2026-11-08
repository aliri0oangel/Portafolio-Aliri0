"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { Globe } from "lucide-react";
import { timeZone, timeZoneLabel } from "@/data/site";

/** Placeholder que renderiza el servidor (y la hidratación) antes de calibrar. */
const PLACEHOLDER = "--:--:--";

/**
 * Variantes visuales del reloj.
 * - `default`: panel completo "Zona horaria local + hora + badge UTC-4"
 *   (usado en ArchitectureShowcase).
 * - `pill`: cápsula compacta estilo navbar de la referencia
 *   (icono Globe · "Venezuela" · punto · mono `UTC-4 • {hora}`)
 *   (usado en ContactSection).
 */
export type LocalClockVariant = "default" | "pill";

/**
 * Formatea la hora actual en la zona horaria del propietario.
 *
 * @returns Hora local en formato `HH:MM:SS` (12h, es-VE).
 */
function formatLocalTime(): string {
  return new Intl.DateTimeFormat("es-VE", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());
}

/** Snapshot del servidor: sin acceso al reloj, se muestra el placeholder. */
function getServerSnapshot(): string {
  return PLACEHOLDER;
}

/**
 * Props del widget de hora local.
 */
export interface LocalClockProps {
  /** Variante visual; por defecto `default` (compatibilidad existente). */
  variant?: LocalClockVariant;
}

/**
 * Widget de hora local en vivo (UTC-4).
 *
 * Comunica de un vistazo la superposición horaria para equipos remotos
 * globales. Implementado con `useSyncExternalStore` (sin `setState` en
 * effects): el servidor renderiza un placeholder y el cliente calibra
 * tras la hidratación sin hydration mismatch.
 *
 * `getSnapshot` devuelve un valor **cacheado** (`cachedRef`) con
 * identidad estable — exigido por `useSyncExternalStore`: la hora solo
 * se recalcula cuando el intervalo notifica, nunca en cada lectura.
 * Así React no detecta inestabilidad ("The result of getSnapshot
 * should be cached to avoid an infinite loop").
 *
 * La lógica de suscripción es idéntica para ambas variantes; solo
 * cambia la presentación (Ajuste 7).
 *
 * @param variant - `default` (panel) o `pill` (cápsula navbar).
 */
export function LocalClock({ variant = "default" }: LocalClockProps) {
  const cachedRef = useRef<string>(PLACEHOLDER);

  /**
   * Suscripción: recalcula la hora y notifica a React **solo** cuando
   * el string formateado cambia. Se calibra de inmediato para mostrar
   * la hora real tras la hidratación (sin parpadeo perceptible).
   *
   * Estable vía `useCallback([])`: `cachedRef` y `formatLocalTime` son
   * estables, así React no re-suscribe en cada render.
   */
  const subscribe = useCallback((onStoreChange: () => void) => {
    const tick = () => {
      const next = formatLocalTime();
      if (next !== cachedRef.current) {
        cachedRef.current = next;
        onStoreChange();
      }
    };
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, []);

  /** Snapshot cacheado: identidad estable entre ticks. */
  const getSnapshot = useCallback(() => cachedRef.current, []);

  const time = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (variant === "pill") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-1/60 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
        <Globe aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent-emerald" />
        <span className="text-xs font-medium text-text-dim">Venezuela</span>
        <span aria-hidden className="text-text-faint">
          ·
        </span>
        <span className="font-mono text-xs tabular-nums text-text-bright">
          {timeZoneLabel} • {time}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-xs text-text-faint">Zona horaria local</span>
        <span className="font-mono text-lg font-semibold text-text-bright tabular-nums">
          {time}
        </span>
      </div>
      <span className="rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-xs text-accent-cyan-bright">
        {timeZoneLabel}
      </span>
    </div>
  );
}
