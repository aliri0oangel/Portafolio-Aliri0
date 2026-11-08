"use client";

import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Props del textarea con contador de caracteres.
 */
interface TextareaProps extends ComponentProps<"textarea"> {
  label: string;
  error?: string;
  /** Longitud actual del valor controlado (para el contador visual). */
  currentLength?: number;
  /** Longitud máxima permitida; muestra `actual / máxima`. */
  maxLength?: number;
}

/**
 * Área de texto accesible con contador visual de caracteres, etiqueta
 * persistente y anuncio de errores mediante `role="alert"`.
 *
 * @param label - Etiqueta visible del campo.
 * @param error - Mensaje de validación a mostrar debajo.
 * @param currentLength - Contador controlado desde el formulario.
 * @param maxLength - Tope máximo mostrado junto al contador.
 */
export function Textarea({
  label,
  error,
  currentLength,
  maxLength,
  className,
  id,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={textareaId} className="text-sm font-medium text-text-dim">
          {label}
        </label>
        {typeof currentLength === "number" && typeof maxLength === "number" ? (
          <span
            aria-hidden
            className={cn(
              "font-mono text-xs",
              currentLength > maxLength ? "text-accent-amber-bright" : "text-text-faint",
            )}
          >
            {currentLength} / {maxLength}
          </span>
        ) : null}
      </div>
      <textarea
        id={textareaId}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "min-h-32 w-full resize-y rounded-lg border bg-surface-1 px-3.5 py-2.5 text-sm text-text-bright",
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
