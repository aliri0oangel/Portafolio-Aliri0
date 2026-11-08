import { Monitor, Server, Wrench, type LucideIcon } from "lucide-react";
import type { ISkill, SkillCategory } from "@/types/skill";
import { skillCategoryLabels } from "@/data/skills";
import { SkillTile } from "./SkillTile";

/**
 * Props de la tarjeta de grupo de tecnologías.
 */
export interface SkillGroupCardProps {
  /** Categoría que define icono, label y filtro de skills. */
  category: SkillCategory;
  /** Lista completa de skills; se filtra internamente por categoría. */
  skills: ISkill[];
}

/**
 * Mapa OCP: categoría → icono Lucide. Añadir una categoría nueva
 * requiere solo agregar una entrada aquí (sin if/else en el render).
 */
const categoryIcons: Record<SkillCategory, LucideIcon> = {
  Frontend: Monitor,
  Backend: Server,
  Complementos: Wrench,
};

/**
 * Estela de borde (Iteración 7): haz de color que rodea el borde
 * de 2px al hacer hover — patrón "conic rotating border" de la
 * referencia, en la paleta del portafolio (esmeralda + cian).
 *
 * Mecanismo: el wrapper tiene `p-[2px]` (grosor del borde) +
 * `overflow-hidden` + `isolate`; el gradiente cónico de 250%×250%
 * gira detrás (`-z-10`) y el panel interior opaco tapa el centro,
 * dejando visible solo la franja perimetral. Detenido en reposo
 * (`opacity-0`) y sin loop con `prefers-reduced-motion`.
 */
const BEAM_STYLE: React.CSSProperties = {
  background:
    "conic-gradient(#0000 0deg 160deg, var(--accent-emerald-bright) 180deg, #0000 200deg 340deg, var(--accent-cyan-bright) 350deg, #0000 360deg)",
};

/**
 * Tarjeta de grupo: encabezado con icono Lucide **estático** (sin
 * animación, decisión del usuario) + sub-grilla de 3 columnas con
 * los tiles de sus tecnologías (las cajas escalan al hover de la
 * card; el icono de cada tile da un salto único al apuntarlo).
 *
 * Hover: lift de 8px + estela de borde + borde esmeralda + glow
 * sutil (identidad "Tech Arsenal").
 */
export function SkillGroupCard({ category, skills }: SkillGroupCardProps) {
  const Icon = categoryIcons[category];
  const groupSkills = skills.filter((skill) => skill.category === category);

  return (
    <div className="group relative isolate h-full overflow-hidden rounded-3xl p-[2px] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)]">
      {/* Estela: solo visible en hover (Iteración 7) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[250%] w-[250%] opacity-0 transition-opacity duration-300 group-hover:opacity-100 animate-[border-spin_4s_linear_infinite] motion-reduce:animate-none"
        style={BEAM_STYLE}
      />
      {/* Panel interior opaco: tapa el centro del gradiente */}
      <div className="relative h-full rounded-[22px] border border-border bg-surface-1 p-8 transition-colors duration-500 group-hover:border-accent-emerald/40">
        {/* Glow decorativo: aparece solo al hover de la tarjeta */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-accent-emerald opacity-0 blur-[60px] transition-opacity duration-700 group-hover:opacity-20"
        />
        <div className="relative z-10">
          <h3 className="mb-8 flex items-center gap-3 text-2xl font-bold text-text-bright">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-2 text-accent-emerald shadow-lg">
              <Icon aria-hidden className="h-6 w-6" />
            </span>
            {skillCategoryLabels[category]}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {groupSkills.map((skill) => (
              <SkillTile key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
