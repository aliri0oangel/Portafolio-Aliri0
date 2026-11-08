import { chromium } from "@playwright/test";

async function runProbe(url = "http://localhost:3000") {
  console.log(`=== INICIANDO SONDA EN ${url} ===`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on("console", (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => consoleLogs.push(`[PAGE_ERROR] ${err.message}`));

  await page.goto(url, { waitUntil: "networkidle" });

  // 1. Verificar CSS servido = disco
  const cssAnalysis = await page.evaluate(() => {
    const rules = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) {
          if (rule.cssText && rule.cssText.includes("theme-knob")) {
            rules.push(rule.cssText);
          }
        }
      } catch {
        // Cross-origin stylesheet ignorada si la hubiera
      }
    }
    return rules;
  });

  console.log(`\n--- CSS SERVIDO (Reglas theme-knob encontradas: ${cssAnalysis.length}) ---`);
  cssAnalysis.forEach((r) => console.log(r));

  // 2. Instrumentar la página antes del clic para medir timeline clic -> commit y rAF frames
  const timelineResult = await page.evaluate(async () => {
    const toggle = document.querySelector('[role="switch"]');
    const knob = document.querySelector('[data-testid="theme-knob"]');
    const sun = knob?.querySelector(".theme-knob__icon--sun");
    const moon = knob?.querySelector(".theme-knob__icon--moon");

    if (!toggle || !knob || !sun || !moon) {
      return { error: "Elementos no encontrados" };
    }

    const events = [];
    let t0 = 0;

    // Instrumentar startViewTransition
    const origSVT = document.startViewTransition;
    if (origSVT) {
      document.startViewTransition = function (cbOrOptions) {
        events.push({ name: "startViewTransition_called", t: performance.now() - t0 });
        let updateFn;
        if (typeof cbOrOptions === "function") {
          updateFn = cbOrOptions;
        } else if (cbOrOptions && typeof cbOrOptions.update === "function") {
          updateFn = cbOrOptions.update;
        }

        const wrappedUpdate = () => {
          events.push({ name: "update_callback_start", t: performance.now() - t0 });
          const res = updateFn ? updateFn() : undefined;
          events.push({ name: "update_callback_end", t: performance.now() - t0 });
          return res;
        };

        const res = typeof cbOrOptions === "function"
          ? origSVT.call(this, wrappedUpdate)
          : origSVT.call(this, { ...cbOrOptions, update: wrappedUpdate });

        if (res && res.ready) {
          res.ready.then(() => events.push({ name: "vt_ready", t: performance.now() - t0 }));
        }
        if (res && res.finished) {
          res.finished.then(() => events.push({ name: "vt_finished", t: performance.now() - t0 }));
        }
        return res;
      };
    }

    // MutationObserver para detectar el commit exacto en el DOM
    const observer = new MutationObserver((mutations) => {
      const now = performance.now() - t0;
      for (const m of mutations) {
        events.push({
          name: `dom_mutation_${m.type}`,
          target: m.target === toggle ? "toggle" : m.target === knob ? "knob" : "other",
          attributeName: m.attributeName,
          ariaChecked: toggle.getAttribute("aria-checked"),
          knobClass: knob.className,
          t: now,
        });
      }
    });

    observer.observe(toggle, { attributes: true, subtree: true, attributeFilter: ["aria-checked", "class"] });

    // Muestreo rAF
    const frameSamples = [];
    let sampling = true;

    function sampleFrame() {
      if (!sampling) return;
      const now = performance.now() - t0;
      const track = toggle.getBoundingClientRect();
      const knobRect = knob.getBoundingClientRect();
      const offset = +(knobRect.left - track.left).toFixed(2);
      const sunCs = getComputedStyle(sun);
      const moonCs = getComputedStyle(moon);
      const knobCs = getComputedStyle(knob);

      frameSamples.push({
        t: +now.toFixed(1),
        offset,
        sunOpacity: sunCs.opacity,
        moonOpacity: moonCs.opacity,
        knobAnim: knobCs.animationName,
        sunAnim: sunCs.animationName,
        moonAnim: moonCs.animationName,
      });

      requestAnimationFrame(sampleFrame);
    }

    // Iniciar el timeline al momento del click
    t0 = performance.now();
    events.push({ name: "click_dispatch", t: 0 });
    requestAnimationFrame(sampleFrame);

    toggle.click();

    // Esperar 450 ms (la animación dura 400 ms)
    await new Promise((resolve) => setTimeout(resolve, 450));
    sampling = false;
    observer.disconnect();

    return {
      events,
      frames: frameSamples.slice(0, 30), // Primeros 30 frames
      finalState: {
        ariaChecked: toggle.getAttribute("aria-checked"),
        sunOpacity: getComputedStyle(sun).opacity,
        moonOpacity: getComputedStyle(moon).opacity,
        offset: +(knob.getBoundingClientRect().left - toggle.getBoundingClientRect().left).toFixed(2),
      },
    };
  });

  console.log("\n--- TIMELINE CLIC → COMMIT ---");
  if (timelineResult.error) {
    console.error("Error:", timelineResult.error);
  } else {
    timelineResult.events.forEach((ev) => {
      console.log(`[t = ${ev.t.toFixed(2)} ms] ${ev.name} ${ev.target || ""} ${ev.attributeName || ""} ${ev.ariaChecked ? `aria-checked=${ev.ariaChecked}` : ""}`);
    });

    const commitEvent = timelineResult.events.find((e) => e.name.startsWith("dom_mutation"));
    const delay = commitEvent ? commitEvent.t : "N/A";
    console.log(`\n===> DELAY CLIC → COMMIT: ${delay !== "N/A" ? delay.toFixed(2) + " ms" : "No detectado"} <===`);

    console.log("\n--- PRIMEROS FRAMES TRAS EL CLIC (rAF) ---");
    timelineResult.frames.slice(0, 15).forEach((f) => {
      console.log(`t=${f.t}ms | offset=${f.offset}px | sunOp=${f.sunOpacity} | moonOp=${f.moonOpacity} | knobAnim=${f.knobAnim} | sunAnim=${f.sunAnim} | moonAnim=${f.moonAnim}`);
    });
  }

  await browser.close();
  return timelineResult;
}

runProbe(process.argv[2] || "http://localhost:3000").catch((err) => {
  console.error("Error ejecutando sonda:", err);
  process.exit(1);
});
