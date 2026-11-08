"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props del toast flotante de notificación.
 */
interface ToastProps {
  visible: boolean;
  message: string;
  /** `success` muestra check esmeralda; `error`, icono de alerta. */
  tone?: "success" | "error";
}

/**
 * Notificación flotante (toast) con animación de entrada/salida.
 * `role="status"` + `aria-live="polite"` para lectores de pantalla.
 *
 * @param visible - Controla la presencia en el DOM (AnimatePresence).
 * @param message - Texto de retroalimentación para el usuario.
 * @param tone - Tono semántico del mensaje.
 */
export function Toast({ visible, message, tone = "success" }: ToastProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2",
            "rounded-lg border border-border-strong bg-surface-2 px-4 py-3 text-sm text-text-bright shadow-xl",
          )}
        >
          {tone === "success" ? (
            <CheckCircle2 aria-hidden className="h-4 w-4 text-accent-emerald" />
          ) : (
            <XCircle aria-hidden className="h-4 w-4 text-accent-amber-bright" />
          )}
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
