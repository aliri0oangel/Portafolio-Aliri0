import type { ISkill } from "@/types/skill";

/**
 * Props del tile individual de tecnología.
 */
export interface SkillTileProps {
  /** Datos de la tecnología a mostrar (incluye URL de docs y badge). */
  skill: ISkill;
}

/**
 * Iconos cuyo SVG original es negro/oscuro: requieren invert en
 * modo oscuro para ser visibles sobre fondo Code Dark.
 * (nextjs, github, vercel son negros; qwik negro por defecto;
 * prisma es `#2d3748` casi negro.)
 */
const INVERT_IN_DARK = new Set(["nextjs", "github", "vercel", "qwik", "prisma"]);

/**
 * Tile individual: caja con icono devicon (gris al 60% → color al
 * hover en 300ms + salto único `icon-hop` de 0.4s), etiqueta de
 * 10px y badge "En proceso" cuando la tecnología está en
 * aprendizaje.
 *
 * Comportamiento: el tile completo es un `<a>` a los docs oficiales
 * (pestaña nueva, `rel` seguro) con `cursor-pointer` para sensación
 * de selección. Accesibilidad: `focus-visible` ring esmeralda,
 * `title` en el badge para lectores de pantalla y `animate-none`
 * bajo `prefers-reduced-motion`.
 *
 * El `alt=""` vacío es intencional: el nombre accesible vive en la
 * etiqueta visible, evitando doble lectura por screen reader.
 */
export function SkillTile({ skill }: SkillTileProps) {
  const invert = INVERT_IN_DARK.has(skill.id);
  const isLearning = skill.status === "learning";

  return (
    <a
      href={skill.url}
      target="_blank"
      rel="noopener noreferrer"
      title={isLearning ? "En proceso — ver docs" : `Docs de ${skill.name}`}
      className="group/icon flex cursor-pointer flex-col items-center gap-2 rounded-xl text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-emerald"
    >
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-2 p-2.5 transition duration-300 group-hover/icon:border-accent-emerald/40 group-hover/icon:bg-surface-1 group-hover:scale-105 motion-reduce:group-hover:scale-100 sm:h-14 sm:w-14 sm:p-3">
        {/* SVGs locales de 0.1-9KB con width/height explícitos (cero CLS).
          next/image aporta poca ganancia en SVGs pequeños auto-hospedados
          y añade el loader de imágenes a la cadena. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={skill.icon}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          className={`h-full w-full object-contain opacity-60 grayscale transition duration-300 group-hover/icon:opacity-100 group-hover/icon:grayscale-0 group-hover/icon:animate-[icon-hop_0.4s_ease-in-out] motion-reduce:group-hover/icon:animate-none${invert ? " dark:invert" : ""}`}
        />

        {/* Badge "En proceso": pill naranja sobre la esquina sup. derecha */}
        {isLearning ? (
          <span
            title="En proceso"
            className="absolute -right-2 -top-2 whitespace-nowrap rounded-full border border-accent-amber/50 bg-accent-amber/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-accent-amber shadow-sm"
          >
            En proceso
          </span>
        ) : null}
      </div>
      <span className="text-[10px] font-medium leading-tight text-text-faint transition-colors duration-300 group-hover/icon:text-text-bright">
        {skill.name}
      </span>
    </a>
  );
}
