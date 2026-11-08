"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  pieceVariants,
  reducedPieceVariants,
  reducedSystemVariants,
  systemVariants,
} from "./heroOrbitMotion";

/**
 * Especificación de cada anillo del sistema orbital (exterior → interior),
 * replicando las proporciones y ritmos de chiragchrg.netlify.app:
 *
 * - Anillos al 90 / 80 / 70 / 60 % del contenedor (sin riel base).
 * - Rotaciones 12 / 10 / 8 / 6 s en sentidos ccw / cw / ccw / cw.
 * - Gradiente conic alternado A (impares) / B (pares) con tokens propios.
 * - Punto teardrop con la variante alterna en los anillos 2 y 4.
 */
interface OrbitTrailSpec {
  /** Clase de ancho (proporción respecto al contenedor). */
  width: string;
  /** Duración de la rotación continua (`--orbit-duration`). */
  duration: string;
  /** Sentido de rotación: horario o antihorario. */
  dir: "cw" | "ccw";
  /** Variante del gradiente conic: A (emerald→cyan) o B (invertido). */
  variant: "a" | "b";
  /** Si el punto usa la orientación alterna (140°, anillos 2 y 4). */
  alt: boolean;
  /** Color del punto (coincide con el acento dominante de su gradiente). */
  dotColor: string;
}

const TRAILS: readonly OrbitTrailSpec[] = [
  { width: "w-[90%]", duration: "12s", dir: "ccw", variant: "b", alt: true, dotColor: "text-accent-cyan-bright" },
  { width: "w-[80%]", duration: "10s", dir: "cw", variant: "a", alt: false, dotColor: "text-accent-emerald-bright" },
  { width: "w-[70%]", duration: "8s", dir: "ccw", variant: "b", alt: true, dotColor: "text-accent-cyan-bright" },
  { width: "w-[60%]", duration: "6s", dir: "cw", variant: "a", alt: false, dotColor: "text-accent-emerald-bright" },
];

/**
 * Sistema orbital interactivo (HeroOrbit) — estilo chiragchrg.netlify.app.
 *
 * Características:
 * - Proporciones de la referencia: contenedor 340→500 px, avatar ≈50 %,
 *   4 anillos al 60/70/80/90 % sin riel base (solo arco conic enmascarado).
 * - Entrada elástica escalonada por pieza (stagger 0.15, spring con rebote)
 *   que degrada a opacidad simple con `prefers-reduced-motion`.
 * - Presión sobre el avatar → escala global del sistema a 0.75 (stagger .06)
 *   manteniendo la opacidad a 1 y con el puntero capturado, de modo que el
 *   gesto no se corte al encoger; también por teclado (Espacio/Enter) y
 *   liberando el estado en blur.
 * - Soltado → variante `release` con stagger invertido: el avatar crece
 *   primero y "empuja" los anillos hacia afuera (dentro → fuera) con rebote.
 * - Puntos teardrop con glow y hover ≥1024 px (escala 1.8 + centro hueco).
 * - Rotaciones CSS pausadas durante el barrido de cambio de tema
 *   (`html.theme-transitioning`) y desactivadas con reduced-motion.
 */
export function HeroOrbit() {
  const reduceMotion = useReducedMotion();
  const [isPressed, setIsPressed] = useState(false);
  /** Marca que el sistema ya fue presionado: a partir de ahí el retorno usa `release`. */
  const [hasPressed, setHasPressed] = useState(false);

  const system = reduceMotion ? reducedSystemVariants : systemVariants;
  const piece = reduceMotion ? reducedPieceVariants : pieceVariants;

  /**
   * Estado de animación expuesto en `data-motion-state`:
   * - `show`: solo la entrada inicial (orden de anillos exterior→interior).
   * - `press`: mientras se mantiene pulsado.
   * - `release`: al soltar, con stagger invertido (el avatar empuja afuera).
   */
  const motionState = reduceMotion
    ? "show"
    : isPressed
      ? "press"
      : hasPressed
        ? "release"
        : "show";

  /**
   * Inicia la presión capturando el puntero: aunque el avatar encoja a 0.75
   * (el cursor puede quedar fuera del nuevo rectángulo), todos los eventos
   * siguen llegando al mismo elemento y el sistema no se "reinicia" solo.
   */
  const handlePressStart = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setHasPressed(true);
    setIsPressed(true);
  };

  /** Cierra el gesto: pointerup, pointercancel, fin de la captura o blur. */
  const handlePressEnd = () => setIsPressed(false);

  return (
    <motion.div
      data-testid="hero-orbit"
      data-pressed={isPressed}
      data-motion-state={motionState}
      aria-label="Sistema orbital interactivo con avatar de Alirio"
      variants={system}
      initial="hidden"
      animate={motionState}
      className="hero-orbit relative flex aspect-square w-full max-w-[340px] md:max-w-[440px] lg:max-w-[500px] select-none items-center justify-center overflow-x-clip"
    >
      {/* Resplandor ambiental de fondo (estático, sin animación propia) */}
      <div
        className="pointer-events-none absolute h-64 w-64 md:h-72 md:w-72 lg:h-80 lg:w-80 rounded-full bg-accent-emerald/20 blur-3xl animate-pulse"
        aria-hidden="true"
      />

      {/* Anillos: exterior → interior (60/70/80/90 % del contenedor) */}
      {TRAILS.map((trail) => (
        <motion.div
          key={trail.duration}
          data-testid="orbit-trail"
          variants={piece}
          aria-hidden="true"
          className={`pointer-events-none absolute ${trail.width} aspect-square rounded-full`}
        >
          {/* Rotador CSS continuo (pausable por tema/reduced-motion) */}
          <div
            data-testid="orbit-rotator"
            className={`orbit-rotator-${trail.dir} absolute inset-0 rounded-full`}
            style={{ "--orbit-duration": trail.duration } as React.CSSProperties}
          >
            {/* Arco conic enmascarado al borde (anillo fino ~1px, sin riel) */}
            <div
              className={`orbit-trail-mask orbit-gradient-${trail.variant} absolute inset-0`}
            />
            {/* Punto teardrop a la cabeza del anillo */}
            <span
              className={`orbit-dot${trail.alt ? " orbit-dot--alt" : ""} ${trail.dotColor}`}
            />
          </div>
        </motion.div>
      ))}

      {/* Núcleo central: avatar interactivo (escala junto al sistema) */}
      <motion.div
        variants={piece}
        role="button"
        tabIndex={0}
        aria-label="Avatar de Alirio — haz click para interactuar"
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerCancel={handlePressEnd}
        onLostPointerCapture={handlePressEnd}
        onBlur={handlePressEnd}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setHasPressed(true);
            setIsPressed(true);
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") setIsPressed(false);
        }}
        className="relative z-20 flex h-[180px] w-[180px] md:h-[220px] md:w-[220px] lg:h-[250px] lg:w-[250px] cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-emerald select-none"
      >
        <div className="relative h-full w-full overflow-hidden rounded-full">
          <Image
            src="/avatar/avatar_alirio.webp"
            alt="Avatar de Alirio"
            width={250}
            height={250}
            priority
            className="h-full w-full object-cover rounded-full select-none pointer-events-none"
          />
        </div>
      </motion.div>

      {/* Micro-pista táctil con despeje vertical seguro y cápsula glass */}
      <div
        className="pointer-events-none absolute -bottom-7 sm:-bottom-8 z-30 inline-flex items-center rounded-full border border-border/40 bg-surface-1/90 px-3 py-0.5 text-[10px] font-mono text-text-faint tracking-wider shadow-sm backdrop-blur-sm"
        aria-hidden="true"
      >
        ✦ mantén presionado para interactuar ✦
      </div>
    </motion.div>
  );
}
