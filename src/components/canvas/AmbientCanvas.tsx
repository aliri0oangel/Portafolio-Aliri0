"use client";

import { useEffect, useRef } from "react";
import { useDeviceTier } from "@/hooks/useDeviceTier";

/**
 * Canvas ambiental interactivo estilo Active Theory, ultraligero.
 *
 * Arquitectura de rendimiento (Tier 1/2):
 * - **Object Pooling**: las partículas se preasignan una sola vez y se
 *   mutan en sitio; cero instanciaciones por frame → sin presión del GC.
 * - Bucle `requestAnimationFrame` con cleanup total al desmontar.
 * - Pausa automática cuando la pestaña pasa a `document.hidden`.
 * - Movimiento del puntero con listeners `{ passive: true }`.
 * - Respeto de `prefers-reduced-motion` (delegado al `useDeviceTier`).
 *
 * Tier 3: no monta canvas alguno; se renderiza un gradido estático CSS
 * como fallback de fondo (cero consumo de CPU/GPU en reposo).
 *
 * @returns Capa de fondo fija, decorativa e inerte al puntero del usuario.
 */
export function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { tier } = useDeviceTier();

  useEffect(() => {
    // Tier 3 / movimiento reducido: sin loop de animación.
    if (tier === "low") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const particleCount = tier === "high" ? 50 : 18;
    const connectionDistance = tier === "high" ? 120 : 90;

    // --- Object Pooling: pool preasignado, mutado en sitio ---
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0004,
      vy: (Math.random() - 0.5) * 0.0004,
      radius: Math.random() * 1.6 + 0.6,
    }));

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let mouseX = -9999;
    let mouseY = -9999;
    let running = true;

    const dotColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--ambient-dot")
      .trim() || "rgba(148, 163, 184, 0.14)";

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      if (!running) return;

      context.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        // Mutación en sitio del pool (sin asignar objetos nuevos).
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Rebote suave en los bordes normalizados [0, 1].
        if (particle.x < 0 || particle.x > 1) particle.vx *= -1;
        if (particle.y < 0 || particle.y > 1) particle.vy *= -1;

        const px = particle.x * width;
        const py = particle.y * height;

        // Atracción sutil hacia el puntero (solo si está en pantalla).
        const dx = mouseX - px;
        const dy = mouseY - py;
        const distance = Math.hypot(dx, dy);
        if (distance < connectionDistance && distance > 0) {
          const influence = (1 - distance / connectionDistance) * 0.4;
          particle.x += (dx / distance) * influence * 0.001;
          particle.y += (dy / distance) * influence * 0.001;
        }

        context.beginPath();
        context.arc(px, py, particle.radius, 0, Math.PI * 2);
        context.fillStyle = dotColor;
        context.fill();
      }

      animationFrame = requestAnimationFrame(draw);
    };

    // Listeners pasivos: el navegador nunca espera a JS para hacer scroll.
    const onMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };
    const onMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        running = false;
        cancelAnimationFrame(animationFrame);
      } else if (!running) {
        running = true;
        animationFrame = requestAnimationFrame(draw);
      }
    };

    resize();
    draw();

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [tier]);

  // Tier 3: fallback estático sin costo de render.
  if (tier === "low") {
    return <div className="ambient-gradient pointer-events-none fixed inset-0 -z-10" aria-hidden />;
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <div className="ambient-gradient absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
