import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Props del input accesible: extiende los atributos nativos y añade
 * metadatos de validación.
 */
interface InputProps extends ComponentProps<"input"> {
  label: string;
  error?: string;
}

/**
 * Campo de texto accesible con etiqueta persistente, estados de error
 * anunciados (`role="alert"` + `aria-invalid`) y objetivos táctiles ≥ 44px.
 *
 * @param label - Etiqueta visible del campo (siempre presente: mejora la
 *   comprensión para lectores de pantalla y usuarios con discognición).
 * @param error - Mensaje de validación a mostrar bajo el input.
 */
export function Input({ label, error, className, id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-text-dim"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "min-h-11 w-full rounded-lg border bg-surface-1 px-3.5 py-2.5 text-sm text-text-bright",
          "placeholder:text-text-faint transition-colors",
          "focus:outline-2 focus:outline-offset-2 focus:outline-accent-emerald",
          error ? "border-accent-amber-bright" : "border-border hover:border-border-strong",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-accent-amber-bright">
          {error}
        </p>
      ) : null}
    </div>
  );
}
