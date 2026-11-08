"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/** Subscribe vacío: el estado se resuelve una sola vez en el cliente. */
function subscribeNoop(): () => void {
  return () => {};
}

/**
 * Detección de hidratación sin `setState` en effects: `false` durante el
 * SSR, `true` tras hidratar en el cliente (patrón React para evitar
 * hydration mismatch con `next-themes`).
 */
function useMounted(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

/**
 * Conmutador accesible de tema (Code Dark / Studio Light).
 *
 * Ajuste 18: es un **interruptor** (`role="switch"` + `aria-checked`)
 * con track de 44×24 px y knob de 20 px que recorre 20 px dentro del
 * track. Dentro del knob viajan ambos iconos (sol y luna) apilados y
 * centrados, con cross-fade + giro/escala según el tema.
 *
 * Accesibilidad: `aria-label` dinámico ("Cambiar a modo claro/oscuro")
 * y `aria-checked` que refleja el tema activo.
 *
 * Nota de animación: el deslizamiento usa `@keyframes`/`animation`
 * (globals.css) y **no** `transition`, porque `disableTransitionOnChange`
 * de next-themes inyecta `transition: none !important` ~1.3 ms después
 * del clic y cancelaría cualquier transición. La clase `theme-knob--to-*`
 * solo se arma tras el primer clic → el primer pintado no reproduce
 * animación alguna.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  // Animación del knob: `false` en el primer pintado; se activa recién
  // en el primer clic y su dirección (to-dark / to-light) la decide el
  // tema destino, así que cada alternancia reinicia la animación.
  const [animate, setAnimate] = useState(false);

  // Gate con `mounted`: durante SSR e hidratación `false` (React usa
  // getServerSnapshot en la hidratación), así los atributos aria del
  // primer commit del cliente son idénticos al HTML del servidor y el
  // knob nace en la misma posición que en el SSR. next-themes devuelve
  // `resolvedTheme === undefined` en el servidor y `"dark"` en el
  // cliente → sin este gate, React lanza "A tree hydrated but some
  // attributes ... didn't match" y el atributo queda sin parchear.
  // Tras hidratar se aplica el tema real.
  const isDark = mounted && resolvedTheme === "dark";

  /**
   * Aplica el tema nuevo y arma la animación del knob.
   * Se llama dentro del callback de la View Transition (si la hay)
   * para que el cambio de posición y la animación nazcan juntos.
   */
  const applyTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    setAnimate(true);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={(e) => {
        const newTheme = isDark ? "light" : "dark";
        if (
          typeof document !== "undefined" &&
          "startViewTransition" in document
        ) {
          // Pausa congelada de animaciones orbitales durante la transición de tema
          document.documentElement.classList.add("theme-transitioning");
          // Coordenadas del clic como punto de expansión circular
          document.documentElement.style.setProperty(
            "--vt-x",
            `${e.clientX}px`,
          );
          document.documentElement.style.setProperty(
            "--vt-y",
            `${e.clientY}px`,
          );
          const doc = document as typeof document & {
            startViewTransition: ((
              cbOrOptions: (() => void) | { update: () => void; types?: string[] },
            ) => { finished?: Promise<void> }) & {
              (cb: () => void): { finished?: Promise<void> };
            };
          };
          // Ajuste 8: con soporte de tipos de VT (:active-view-transition-type)
          // se etiqueta la transición como `theme` para que el CSS re-escopado
          // (globals.css) aplique el wipe circular SOLO al tema; el crossfade
          // `section-nav` queda reservado a la navegación de secciones. Sin
          // soporte de tipos se usa la firma legacy (sin etiqueta) — el CSS
          // legacy sin scoping cubre ese caso.
          const supportsTransitionTypes =
            typeof window !== "undefined" &&
            typeof window.CSS !== "undefined" &&
            typeof window.CSS.supports === "function" &&
            window.CSS.supports(
              "selector(:active-view-transition-type(theme))",
            );
          const transition = supportsTransitionTypes
            ? doc.startViewTransition({
                update: () => applyTheme(newTheme),
                types: ["theme"],
              })
            : doc.startViewTransition(() => applyTheme(newTheme));

          if (transition && transition.finished) {
            transition.finished.finally(() => {
              document.documentElement.classList.remove("theme-transitioning");
            });
          } else {
            setTimeout(() => {
              document.documentElement.classList.remove("theme-transitioning");
            }, 750);
          }
        } else {
          applyTheme(newTheme);
        }
      }}
      className={cn(
        // Track del switch: 44×24 px, pill con los tokens del proyecto.
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full",
        "border border-border bg-surface-1",
        "transition-colors hover:border-border-strong",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-emerald",
        className,
      )}
    >
      {/* Knob de 20×20 con inset de 1 px desde el padding box = 2 px
          desde el borde exterior (el `border` de 1 px del track cuenta
          dentro de su border-box): recorrido de 20 px (translate-x-5)
          hasta quedar simétrico a 2 px del borde derecho.
          `pointer-events-none` para que el hover/clic siempre los capture
          el track. La clase de animación solo existe tras el primer clic. */}
      <span
        data-testid="theme-knob"
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-px top-px flex h-5 w-5 items-center justify-center",
          "rounded-full bg-text-bright text-bg shadow-sm",
          isDark ? "translate-x-5" : "translate-x-0",
          animate && (isDark ? "theme-knob--to-dark" : "theme-knob--to-light"),
        )}
      >
        {/* Ambos iconos viajan dentro del knob (12 px), apilados y
            centrados; el tema decide cuál es visible (luna en oscuro,
            sol en claro). Antes de hidratar se renderiza un placeholder
            sin <svg> (regresión Iteración 4). */}
        {mounted ? (
          <>
            <Sun
              aria-hidden
              className={cn(
                "theme-knob__icon theme-knob__icon--sun absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2",
                isDark ? "opacity-0 -rotate-90 scale-[0.4]" : "opacity-100",
              )}
            />
            <Moon
              aria-hidden
              className={cn(
                "theme-knob__icon theme-knob__icon--moon absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2",
                isDark ? "opacity-100" : "opacity-0 -rotate-90 scale-[0.4]",
              )}
            />
          </>
        ) : (
          <span className="h-3 w-3" />
        )}
      </span>
    </button>
  );
}
