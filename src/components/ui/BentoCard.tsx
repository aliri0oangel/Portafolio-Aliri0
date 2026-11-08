import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Tarjeta Bento con aislamiento de pintura CSS (`contain: layout style paint`).
 *
 * Garantiza que cualquier microinteracción de hover o animación interna
 * nunca provoque un reflow del resto de la página (layout thrashing),
 * crítico en móviles de gama baja.
 *
 * @param props - Props nativas de `<div>` más la clase adicional.
 * @returns Contenedor estilizado listo para contenido de sección.
 */
export function BentoCard({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "card-contain rounded-xl border border-border bg-surface-1 p-6",
        // Elevación sutil solo en modo claro: en oscuro el contraste lo da el borde.
        "shadow-[0_1px_2px_rgb(15_23_42/0.04),0_4px_16px_rgb(15_23_42/0.05)] dark:shadow-none",
        "transition-colors duration-200 hover:border-border-strong",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
