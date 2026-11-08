import Link from "next/link";

/**
 * Página 404 global.
 *
 * Se muestra cuando la ruta no existe. Mantiene la identidad
 * visual del sitio (eyebrow mono + H2 + CTA).
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
      <span className="font-mono text-xs uppercase tracking-widest text-accent-emerald">
        Error 404
      </span>
      <h1 className="text-4xl font-bold text-text-bright sm:text-6xl">
        Página no encontrada
      </h1>
      <p className="max-w-md text-base leading-relaxed text-text-dim">
        La ruta que buscas no existe o fue movida. Vuelve al inicio
        para explorar el portafolio.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-btn-primary px-5 text-sm font-semibold text-btn-primary-fg transition-colors hover:bg-btn-primary-hover"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
