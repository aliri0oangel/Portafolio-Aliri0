import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: "no-preference" });
  await page.goto("http://localhost:3100", { waitUntil: "networkidle" });

  const toggle = page.getByRole("switch", { name: /cambiar a modo/i });
  const knob = page.getByTestId("theme-knob");

  const load = await knob.evaluate((el) => {
    const cs = getComputedStyle(el);
    const track = el.parentElement;
    const sun = el.querySelector(".theme-knob__icon--sun");
    const moon = el.querySelector(".theme-knob__icon--moon");
    return {
      offset: el.getBoundingClientRect().left - track.getBoundingClientRect().left,
      animationName: cs.animationName,
      animationDuration: cs.animationDuration,
      className: el.className,
      ariaChecked: track.getAttribute("aria-checked"),
      sunOpacity: getComputedStyle(sun).opacity,
      moonOpacity: getComputedStyle(moon).opacity,
      iconCount: el.querySelectorAll("svg").length,
    };
  });

  await toggle.click();
  await page.waitForTimeout(600);

  const afterClick = await knob.evaluate((el) => {
    const cs = getComputedStyle(el);
    const track = el.parentElement;
    const sun = el.querySelector(".theme-knob__icon--sun");
    const moon = el.querySelector(".theme-knob__icon--moon");
    return {
      offset: el.getBoundingClientRect().left - track.getBoundingClientRect().left,
      animationName: cs.animationName,
      animationDuration: cs.animationDuration,
      easing: cs.animationTimingFunction.replace(/\s+/g, ""),
      ariaChecked: track.getAttribute("aria-checked"),
      sunOpacity: getComputedStyle(sun).opacity,
      moonOpacity: getComputedStyle(moon).opacity,
      htmlClass: document.documentElement.className,
    };
  });

  await toggle.click();
  await page.waitForTimeout(600);

  const backToDark = await knob.evaluate((el) => {
    const cs = getComputedStyle(el);
    const track = el.parentElement;
    return {
      offset: el.getBoundingClientRect().left - track.getBoundingClientRect().left,
      animationName: cs.animationName,
      ariaChecked: track.getAttribute("aria-checked"),
    };
  });

  const out = {
    out: path.join(process.env.TEMP || "C:/Users/ALIRIO/AppData/Local/Temp", "opencode", "a18"),
    load,
    afterClick,
    backToDark,
    consoleErrors: [],
  };

  const targetFile = path.join(process.env.TEMP || "C:/Users/ALIRIO/AppData/Local/Temp", "opencode", "a18", "probe.json");
  fs.writeFileSync(targetFile, JSON.stringify(out, null, 2));
  console.log("probe.json guardado en:", targetFile);
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
