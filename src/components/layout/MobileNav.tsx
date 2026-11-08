"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { navLinks } from "@/data/site";
import { cn } from "@/lib/utils";

/**
 * Props del menú móvil.
 */
interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  activeSection: string;
  onNavigate: (id: string) => void;
}

/**
 * Menú de navegación móvil a pantalla completa.
 *
 * Accesibilidad y rendimiento:
 * - Bloqueo del scroll del body mientras está abierto.
 * - Targets táctiles ≥ 48x48px.
 * - `role="dialog"` + `aria-modal` + cierre con la tecla Escape.
 * - Los links hacen `preventDefault` y delegan en `onNavigate`
 *   (scroll al ancla del eyebrow, sin salto nativo duplicado).
 */
export function MobileNav({ open, onClose, activeSection, onNavigate }: MobileNavProps) {
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Navegación principal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-40 bg-bg/95 backdrop-blur-sm md:hidden"
        >
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="absolute right-4 top-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-border text-text-dim"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>

            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(link.id);
                  onClose();
                }}
                className={cn(
                  "flex min-h-12 min-w-56 items-center gap-3 rounded-lg px-5 text-lg transition-colors",
                  activeSection === link.id
                    ? "bg-surface-2 text-text-bright"
                    : "text-text-dim",
                )}
              >
                {link.label}
              </a>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
