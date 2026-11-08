import type { Variants } from "framer-motion";

/**
 * Contratos de movimiento del sistema orbital.
 *
 * Se mantienen fuera del componente para poder testearlos como datos puros
 * (sin depender de rAF/WAAPI de jsdom) y para que `HeroOrbit` conserve una
 * única responsabilidad: renderizar e interactuar.
 *
 * - `show`: entrada inicial (anillos exterior→interior, avatar al final).
 * - `press`: contracción global del sistema (avatar + anillos).
 * - `release`: retorno tras soltar con stagger invertido (avatar primero y
 *   anillos de dentro hacia fuera), para que el crecimiento del avatar parezca
 *   empujar las órbitas hacia afuera.
 * - `reduced*`: alternativas sin escala para `prefers-reduced-motion`.
 */

/**
 * Target en reposo de cada pieza (entrada y retorno): opacidad en tween
 * corto y escala con spring de rebote, en transiciones separadas para que el
 * crecimiento no arrastre un fundido. Se crea por llamada para que `show` y
 * `release` no compartan referencia.
 */
const restingPiece = () => ({
  opacity: 1,
  scale: 1,
  transition: {
    opacity: { duration: 0.2, ease: "easeOut" as const },
    scale: { type: "spring" as const, bounce: 0.6, duration: 1.8 },
  },
});

export const systemVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
  press: { transition: { staggerChildren: 0.06 } },
  /**
   * Retorno con `staggerDirection: -1`: Framer recorre los hijos al revés, y
   * como el avatar es el último del DOM es el primero en crecer. Los anillos
   * siguen 60% → 70% → 80% → 90% (dentro hacia fuera) con un solape de 60 ms
   * que produce el efecto de empuje con rebote suave.
   */
  release: {
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.06,
      staggerDirection: -1,
    },
  },
};

/**
 * Variantes de cada pieza (avatar y anillos):
 * - Entrada/soltado: scale .75 → 1 con spring de rebote (≈ elastic.out).
 * - Presión: contracción estable a .75 en 150 ms **manteniendo opacidad 1**.
 *
 * Nota de regresión: `press` declara `opacity: 1` de forma explícita porque
 * Framer Motion resuelve las propiedades ausentes de una variante con el
 * valor de `hidden`; sin esta línea, al pulsar el avatar se animaba la
 * opacidad a 0 y todo el sistema desaparecía. Por eso `release` también
 * declara su target completo: no debe caer en `hidden` tampoco.
 */
export const pieceVariants: Variants = {
  hidden: { opacity: 0, scale: 0.75 },
  show: restingPiece(),
  press: {
    opacity: 1,
    scale: 0.75,
    transition: {
      opacity: { duration: 0.15, ease: "easeOut" },
      scale: { duration: 0.15, ease: "easeOut" },
    },
  },
  release: restingPiece(),
};

/** Alternativas sin escala cuando `prefers-reduced-motion` está activo. */
export const reducedSystemVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0 } },
  press: {},
  release: {},
};

export const reducedPieceVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
  press: { opacity: 1 },
  release: { opacity: 1 },
};
