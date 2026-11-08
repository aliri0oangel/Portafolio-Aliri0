"use client";

import { useEffect } from "react";
import {
  Copy,
  Check,
  ArrowUpRight,
  Mail,
  MessageCircle,
  Send,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { socials, whatsappUrl } from "@/data/socials";
import { useClipboard } from "@/hooks/useClipboard";
import { useContactForm } from "@/hooks/useContactForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Toast } from "@/components/ui/Toast";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LocalClock } from "@/components/sections/LocalClock";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

/**
 * Sección de contacto — Ajuste 7: rediseño de 2 columnas inspirado en
 * `portfolio-peach-nine-crjsjzebx5.vercel.app`.
 *
 * Col 1 (izquierda): SectionHeader (mismos eyebrow/título/descripción)
 * + LocalClock en variante "pill" (estilo navbar de referencia)
 * + grilla 2x2 de enlaces directos (Ajuste 15, movida desde la card;
 * mismo orden WhatsApp → GitHub → Email → LinkedIn, mismos
 * data-testid, sin motion: aparecen estáticos al entrar en pantalla).
 * El strip de SLA se eliminó: la información vive en el subtítulo.
 *
 * Col 2 (derecha): card glassmorphic SOLO con el mini-formulario de 3
 * campos (Nombre, Correo, Mensaje — sin select de asunto; el subject
 * viaja fijo como "Consulta General" vía defaultValues en
 * useContactForm, sin tocar contactSchema ni /api/contact).
 *
 * Motion (Ajuste 8): el encabezado (col 1) se revela con
 * scroll-driven animations (clase `.reveal`) y el panel derecho
 * usa `@starting-style` — arranca oculto y `useRevealOnScroll`
 * (IntersectionObserver, once) añade `.is-visible` al entrar en
 * pantalla (stagger por `--i`). Los enlaces de col 1 quedan fuera
 * de ese sistema por decisión de diseño (Ajuste 15).
 *
 * Se conservan honeypot anti-spam, Toast de estado y useClipboard.
 */
export function ContactSection() {
  const { copy, copied } = useClipboard();
  const { form, onSubmit, status, serverMessage, resetStatus } =
    useContactForm();
  const {
    register,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  // Reveal del panel derecho (Ajuste 8): IntersectionObserver once.
  const panelRef = useRevealOnScroll<HTMLDivElement>();

  const messageValue = watch("message") ?? "";

  // El toast de éxito/error se auto-oculta a los 4s.
  useEffect(() => {
    if (status === "idle") return;
    const timeoutId = setTimeout(resetStatus, 4000);
    return () => clearTimeout(timeoutId);
  }, [status, resetStatus]);

  return (
    <section
      id="contacto"
      className="section-contain py-12 pb-20 sm:py-16 sm:pb-24 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center lg:py-0 lg:pb-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
          {/* ========================================================
               COL 1 (izquierda): Encabezado + reloj pill + enlaces
               directos (Ajuste 15) — 5 cols
               ======================================================== */}
          <div
            data-testid="contact-intro"
            className="flex flex-col gap-6 lg:col-span-5"
          >
            <SectionHeader
              eyebrow="Contacto"
              title="Hablemos de tu próximo proyecto."
              description="Elige el canal que prefieras o envía un mensaje directo. Respondo en menos de 24 horas hábiles — sin formularios interminables ni spam."
              className="reveal mb-0 md:mb-0"
            />

            {/* Hora local en vivo, variante pill estilo navbar de la
                referencia: "Venezuela · UTC-4 • {hora}". */}
            <div data-testid="contact-local-clock" className="self-start">
              <LocalClock variant="pill" />
            </div>

            {/* ========================================================
                 ENLACES DIRECTOS: grilla 2x2 bajo el reloj (col 1)
                 ======================================================== */}
            <div className="border-t border-border/50 pt-4">
              <span
                aria-hidden
                className="mb-3 block font-mono text-[10px] font-semibold tracking-widest uppercase text-text-faint"
              >
                Enlaces directos
              </span>

              {/*
                Grilla de enlaces directos (Ajuste 17):
                - `sm:grid-cols-2` → 2 columnas de 640 px en adelante.
                - `lg:grid-cols-1` → en 1024–1279 px la columna 1 de la
                  sección mide ~406 px y las celdas de 2 columnas
                  quedaban en ~180 px: insuficiente para icono +
                  "Contacto" + 2 botones (el subtítulo se truncaba a
                  "Con…"). Al apilarse, cada card usa el ancho completo.
                - `xl:grid-cols-2` → desde 1280 px las celdas alcanzan
                  ~200 px y vuelve la grilla 2×2.
              */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {/* Canal 1: WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="contact-card-whatsapp"
                  aria-label="Contactar por WhatsApp"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface-1/40 px-4 py-3 backdrop-blur-md transition-all duration-300 hover:border-accent-emerald-bright/50 hover:bg-surface-1/65 hover:shadow-[0_0_24px_var(--glow-emerald)] motion-reduce:hover:translate-y-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-emerald/30 bg-accent-emerald/15 text-accent-emerald">
                      <MessageCircle aria-hidden className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-xs font-semibold text-text-bright">
                        WhatsApp
                      </span>
                      <span className="text-[11px] text-text-dim">
                        Chat directo
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-text-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-emerald-bright"
                  />
                </a>

                {/* Canal 2: GitHub */}
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="contact-card-github"
                  aria-label="Perfil de GitHub"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface-1/40 px-4 py-3 backdrop-blur-md transition-all duration-300 hover:border-accent-emerald-bright/50 hover:bg-surface-1/65 hover:shadow-[0_0_24px_var(--glow-emerald)] motion-reduce:hover:translate-y-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-text-dim">
                      <GithubIcon className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-xs font-semibold text-text-bright">
                        GitHub
                      </span>
                      <span className="font-mono text-[11px] text-text-dim">
                        Repositorios
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-text-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-cyan-bright"
                  />
                </a>

                {/* Canal 3: Email con copiado y apertura.
                    Ajuste 17: contenido uniforme en 2 líneas (Email / Contacto)
                    para evitar desbordes en ≥1024 px y garantizar 59 px de
                    altura idéntica a las demás cards. El padding `px-4` es el
                    mismo que las otras 3 cards (la grilla se apila en `lg`
                    para que el texto no tenga que recortarse). */}
                <div
                  data-testid="contact-card-email"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface-1/40 px-4 py-3 backdrop-blur-md transition-all duration-300 hover:border-accent-emerald-bright/50 hover:bg-surface-1/65 hover:shadow-[0_0_24px_var(--glow-emerald)]"
                >
                  {/* min-w-0 permite que el grupo izquierdo ceda espacio a los botones
                      en viewports de ~180px de card (lg, Ajuste 17) */}
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-emerald/30 bg-accent-emerald/15 text-accent-emerald">
                      <Mail aria-hidden className="h-4 w-4" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs font-semibold text-text-bright">
                        Email
                      </span>
                      <span className="truncate font-mono text-[11px] text-text-dim">
                        Contacto
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copy(socials.email)}
                      aria-label="Copiar correo al portapapeles"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-text-dim transition-colors hover:border-accent-emerald hover:text-accent-emerald-bright"
                    >
                      {copied ? (
                        <Check
                          aria-hidden
                          className="h-3.5 w-3.5 text-accent-emerald-bright"
                        />
                      ) : (
                        <Copy aria-hidden className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <a
                      href={`mailto:${socials.email}`}
                      aria-label="Abrir correo en el cliente de email"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-text-dim transition-colors hover:border-accent-emerald hover:text-accent-emerald-bright"
                    >
                      <ArrowUpRight
                        aria-hidden
                        className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </a>
                  </span>
                </div>

                {/* Canal 4: LinkedIn */}
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="contact-card-linkedin"
                  aria-label="Perfil de LinkedIn"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface-1/40 px-4 py-3 backdrop-blur-md transition-all duration-300 hover:border-accent-emerald-bright/50 hover:bg-surface-1/65 hover:shadow-[0_0_24px_var(--glow-emerald)] motion-reduce:hover:translate-y-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-text-dim">
                      <LinkedinIcon className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-xs font-semibold text-text-bright">
                        LinkedIn
                      </span>
                      <span className="font-mono text-[11px] text-text-dim">
                        Conectar
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-text-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-cyan-bright"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* ========================================================
               COL 2 (derecha): Card glassmorphic solo con el mini-form
               (7 cols) — los enlaces viven en col 1 (Ajuste 15)
               ======================================================== */}
          <div
            data-testid="contact-panel"
            ref={panelRef}
            className="reveal-card-grid lg:col-span-7"
          >
            <div
              className="reveal-card flex-col rounded-3xl border border-border-strong/60 bg-surface-1/50 p-5 backdrop-blur-xl shadow-[0_0_50px_-10px_var(--glow-emerald)] sm:p-7"
              style={{ "--i": 0 } as React.CSSProperties}
            >
              {/* Micro-encabezado interior */}
              <div className="mb-4 flex items-center gap-2 border-b border-border/50 pb-2.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-accent-emerald/20 text-accent-emerald-bright shadow-[0_0_12px_var(--glow-emerald)]">
                  <Send aria-hidden className="h-3 w-3" />
                </span>
                <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-text-dim">
                  Envíame un mensaje
                </span>
              </div>

              <form
                onSubmit={onSubmit}
                noValidate
                className="flex flex-col gap-4"
              >
                {/* Nombre y Correo en 2 columnas */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Nombre completo"
                    placeholder="ej. Juan Pérez"
                    autoComplete="name"
                    error={errors.name?.message}
                    {...register("name")}
                  />
                  <Input
                    label="Correo electrónico"
                    type="email"
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </div>

                {/* Mensaje */}
                <Textarea
                  label="Mensaje"
                  placeholder="Cuéntame sobre tu proyecto, objetivos y plazos..."
                  currentLength={messageValue.length}
                  maxLength={1000}
                  rows={3}
                  error={errors.message?.message}
                  {...register("message")}
                />

                {/* Honeypot anti-spam (subject fijo "Consulta General"
                    via defaultValues en useContactForm) */}
                <div
                  aria-hidden
                  className="absolute -left-[9999px] h-px w-px overflow-hidden"
                >
                  <label htmlFor="website">No rellenar este campo</label>
                  <input
                    id="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    {...register("website")}
                  />
                </div>

                {/* Botón de envío de ancho completo */}
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-11 justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          aria-hidden
                          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send aria-hidden className="h-4 w-4" />
                        Enviar Mensaje
                      </>
                    )}
                  </Button>

                  {serverMessage ? (
                    <p
                      role="status"
                      className={
                        status === "success"
                          ? "text-center text-xs text-accent-emerald-bright"
                          : "text-center text-xs text-accent-amber-bright"
                      }
                    >
                      {serverMessage}
                    </p>
                  ) : null}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Toast
        visible={status === "success" && !isSubmitting}
        message={serverMessage || "¡Mensaje enviado con éxito!"}
        tone="success"
      />
    </section>
  );
}
