"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Duración visible del toast de confirmación (ms). */
const TOAST_DURATION_MS = 2000;

/**
 * Copia texto al portapapeles con feedback de estado efímero.
 * Usa la Clipboard API con fallback a `execCommand` para contextos
 * inseguros (HTTP local) donde `navigator.clipboard` no existe.
 *
 * @param resetMs - Milisegundos antes de reiniciar el estado `copied`.
 * @returns Texto a copiar, estado de éxito y disparador.
 */
export function useClipboard(resetMs: number = TOAST_DURATION_MS) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback para contextos no-secure (dev over HTTP).
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          textarea.remove();
        }

        setCopied(true);
        setError(false);
      } catch {
        setError(true);
        setCopied(false);
      }

      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        setError(false);
      }, resetMs);
    },
    [resetMs],
  );

  return { copy, copied, error };
}
