"use client";

import { useSyncExternalStore } from "react";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { socials } from "@/data/socials";
import { navLinks } from "@/data/site";

/** Subscribe vacío: el año solo cambia por eventos del sistema (Año Nuevo). */
function subscribeNoop(): () => void {
  return () => {};
}

/**
 * Pie de página con enlaces rápidos, redes profesionales y año dinámico.
 *
 * El año se resuelve con `useSyncExternalStore`: el servidor renderiza sin
 * año y el cliente lo completa tras la hidratación (cero mismatch).
 */
export function Footer() {
  const year = useSyncExternalStore(
    subscribeNoop,
    () => new Date().getFullYear(),
    () => 0,
  );

  return (
    <footer className="border-t border-border bg-surface-1/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-evenly lg:px-8">
        <div className="flex flex-col gap-1">
          {/* <span className="text-sm font-semibold text-text-bright">alirio.dev</span> */}
          <span className="text-xs text-text-faint">
            {year !== 0 ? `© ${year} ` : "© "} Alirio Hernández • Venezuela (UTC-4).
          </span>
        </div>

        {/* <nav aria-label="Enlaces del pie de página">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className="text-xs text-text-dim transition-colors hover:text-text-bright"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav> */}

        {/* <ul className="flex items-center gap-3">
          <li>
            <a
              href={socials.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Perfil de GitHub"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-dim transition-colors hover:border-border-strong hover:text-text-bright"
            >
              <GithubIcon className="h-4 w-4" />
            </a>
          </li>
          <li>
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Perfil de LinkedIn"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-dim transition-colors hover:border-border-strong hover:text-text-bright"
            >
              <LinkedinIcon className="h-4 w-4" />
            </a>
          </li>
          <li>
            <a
              href={`mailto:${socials.email}`}
              aria-label="Enviar correo electrónico"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-dim transition-colors hover:border-border-strong hover:text-text-bright"
            >
              <Mail aria-hidden className="h-4 w-4" />
            </a>
          </li>
        </ul> */}
      </div>
    </footer>
  );
}
