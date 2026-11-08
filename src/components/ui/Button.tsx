import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Variantes visuales del botón polimórfico.
 */
type ButtonVariant = "primary" | "secondary" | "ghost";

/**
 * Props del botón: extiende los atributos nativos de `<button>` para
 * preservar la sustitución de Liskov (cualquier prop válida en un button
 * nativo sigue siendo válida aquí).
 */
interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-btn-primary text-btn-primary-fg shadow-[0_0_24px_var(--glow-emerald)]",
    "hover:-translate-y-0.5 hover:bg-btn-primary-hover",
    "active:translate-y-0",
  ),
  secondary: cn(
    "border border-border-strong bg-transparent text-text-bright",
    "hover:border-accent-cyan hover:text-accent-cyan-bright",
  ),
  ghost: "text-text-dim hover:text-text-bright",
};

/**
 * Botón polimórfico reutilizable con variantes semánticas.
 *
 * @param variant - Estilo visual: `primary` (alta conversión), `secondary` o `ghost`.
 * @param props - Props nativas de `<button>` (onClick, type, disabled...).
 * @returns Elemento JSX accesible y enfocable por teclado.
 */
export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-emerald",
        "disabled:pointer-events-none disabled:opacity-60",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
