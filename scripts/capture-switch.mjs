import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

async function capture() {
  const outDir = path.join(process.env.TEMP || "C:/Users/ALIRIO/AppData/Local/Temp", "opencode", "a18");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();

  console.log("Navegando a http://localhost:3100...");
  await page.goto("http://localhost:3100", { waitUntil: "networkidle" });

  const toggle = page.getByRole("switch", { name: /cambiar a modo/i });
  const topbar = page.getByRole("banner");

  await page.waitForTimeout(500);

  // 1. Estado inicial oscuro: knob a la derecha con luna
  console.log("Capturando switch-dark.png y topbar-dark.png...");
  await toggle.screenshot({ path: path.join(outDir, "switch-dark.png") });
  await topbar.screenshot({ path: path.join(outDir, "topbar-dark.png") });

  // 2. Click para alternar a claro: knob a la izquierda con sol
  console.log("Haciendo click para alternar a claro...");
  await toggle.click();
  // Esperar a que termine la animación (0.4s) y el settle
  await page.waitForTimeout(600);

  console.log("Capturando switch-light.png y topbar-light.png...");
  await toggle.screenshot({ path: path.join(outDir, "switch-light.png") });
  await topbar.screenshot({ path: path.join(outDir, "topbar-light.png") });

  console.log("Capturas guardadas exitosamente en:", outDir);

  await browser.close();
}

capture().catch((err) => {
  console.error("Error en capturas:", err);
  process.exit(1);
});
