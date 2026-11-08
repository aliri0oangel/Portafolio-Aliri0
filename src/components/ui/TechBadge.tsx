import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Props del badge tecnológico.
 */
interface TechBadgeProps {
  label: string;
  /** Icono decorativo opcional (e.g. `<TechIcon name={label} />`) previo al label. */
  icon?: ReactNode;
  /** Versión o variante opcional mostrada en monoespaciada (e.g. "v15"). */
  version?: string;
  className?: string;
}

/**
 * Badge compacto de tecnología con icono opcional, etiqueta y versión
 * en tipografía monoespaciada — identidad "CodeCraft UI".
 *
 * @param label - Nombre formal de la tecnología.
 * @param icon - Icono decorativo opcional renderizado antes del label.
 * @param version - Badge de versión opcional.
 * @returns Elemento JSX inline no interactivo.
 */
export function TechBadge({ label, icon, version, className }: TechBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2 py-1",
        "text-xs font-medium text-text-dim",
        className,
      )}
    >
      {icon}
      {label}
      {version ? (
        <span className="font-mono text-[10px] text-accent-amber">{version}</span>
      ) : null}
    </span>
  );
}
