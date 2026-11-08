"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Cloud, Database, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocalClock } from "@/components/sections/LocalClock";

/**
 * Grupos del stack tecnológico mostrados en el Showcase de Arquitectura.
 */
const stackTabs = [
  {
    id: "frontend",
    label: "Frontend",
    icon: Cloud,
    items: ["Next.js 15", "React 19", "TypeScript 5", "Tailwind CSS 4"],
  },
  {
    id: "backend",
    label: "Backend & CMS",
    icon: Database,
    items: ["WordPress Headless", "REST / GraphQL", "Zod", "Node.js"],
  },
  {
    id: "devops",
    label: "DevOps",
    icon: Server,
    items: ["Vercel Edge", "GitHub Actions", "pnpm", "Git Flow"],
  },
] as const;

type StackTabId = (typeof stackTabs)[number]["id"];

/**
 * Tarjeta Bento interactiva de ingeniería (Architecture Showcase).
 *
 * Permite explorar el stack en producción por pestañas (Frontend /
 * Backend & CMS / DevOps) sin escribir comandos ni descifrar una
 * terminal. El pie integra el reloj local (Iteración 6). Las
 * transiciones se simplifican a opacidad instantánea con
 * `prefers-reduced-motion`.
 */
export function ArchitectureShowcase() {
  const [activeTab, setActiveTab] = useState<StackTabId>("frontend");
  const reduceMotion = useReducedMotion();

  const active = stackTabs.find((tab) => tab.id === activeTab) ?? stackTabs[0];
  const ActiveIcon = active.icon;

  // `key` NUNCA dentro de este objeto: React 19 prohíbe que una clave
  // se entregue vía spread ("A props object containing a key prop is
  // being spread into JSX"). Se pasa como prop directa del JSX abajo.
  const panelTransition = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 },
    transition: { duration: 0.18, ease: "easeOut" as const },
  };

  return (
    <div className="card-contain flex h-full flex-col gap-5 rounded-2xl border border-border bg-surface-1 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" aria-hidden />
          <span className="ml-2 font-mono text-xs text-text-faint">stack.production</span>
        </div>
      </div>

      {/* Selector de pestañas accesible */}
      <div role="tablist" aria-label="Categorías del stack" className="flex gap-1.5">
        {stackTabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "min-h-10 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-surface-2 text-text-bright"
                  : "text-text-dim hover:text-text-bright",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          role="tabpanel"
          aria-label={active.label}
          {...panelTransition}
          className="flex flex-1 flex-col gap-4"
        >
          <div className="flex items-center gap-2 text-accent-cyan-bright">
            <ActiveIcon aria-hidden className="h-4 w-4" />
            <span className="font-mono text-xs uppercase tracking-wider">{active.label}</span>
          </div>

          <ul className="grid grid-cols-2 gap-2">
            {active.items.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-bright"
              >
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>

      <div className="border-t border-border pt-4">
        <LocalClock />
      </div>
    </div>
  );
}
