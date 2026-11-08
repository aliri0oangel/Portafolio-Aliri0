import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { skills, skillCategoryLabels } from "../skills";
import type { SkillCategory } from "@/types/skill";

/**
 * Tests de datos de la matriz de competencias (Ajuste 7 — standby:
 * 16 skills activas; las 5 tecnologías en aprendizaje —Qwik,
 * PostgreSQL, Prisma, GraphQL, Jira— quedan COMENTADAS con nota
 * `// STANDBY` para reactivarse descomentándolas).
 *
 * Garantiza: 16 skills activas en 3 categorías, ids únicos POR
 * CATEGORÍA (una tecnología puede vivir en dos cards), URLs de docs
 * válidas, CERO skills con status learning (badge "En proceso"
 * desactivado), rutas de icono consistentes y que los SVG existan
 * en /public/tech.
 */
describe("skills data", () => {
  it("contiene exactamente 16 tecnologías activas (5 en standby)", () => {
    expect(skills).toHaveLength(16);
  });

  it("ids únicos dentro de cada categoría (permitidos entre cards)", () => {
    const cats: SkillCategory[] = ["Frontend", "Backend", "Complementos"];
    for (const cat of cats) {
      const ids = skills.filter((s) => s.category === cat).map((s) => s.id);
      expect(new Set(ids).size, `ids duplicados en ${cat}`).toBe(ids.length);
    }
  });

  it("cada skill tiene una categoría válida", () => {
    const valid: SkillCategory[] = ["Frontend", "Backend", "Complementos"];
    for (const skill of skills) {
      expect(valid).toContain(skill.category);
    }
  });

  it("cada skill tiene nombre y ruta de icono no vacíos", () => {
    for (const skill of skills) {
      expect(skill.name.trim().length).toBeGreaterThan(0);
      expect(skill.icon.trim().length).toBeGreaterThan(0);
    }
  });

  it("las rutas de icono apuntan a /tech/ con sufijo -original.svg", () => {
    for (const skill of skills) {
      expect(skill.icon).toMatch(/^\/tech\/[a-z0-9-]+-original\.svg$/);
    }
  });

  it("reparte las skills en 8 Frontend, 4 Backend y 4 Complementos", () => {
    const count = (cat: SkillCategory) =>
      skills.filter((s) => s.category === cat).length;
    expect(count("Frontend")).toBe(8);
    expect(count("Backend")).toBe(4);
    expect(count("Complementos")).toBe(4);
  });

  it("todas las skills enlazan a sus docs oficiales por https", () => {
    for (const skill of skills) {
      expect(skill.url).toMatch(/^https:\/\//);
    }
  });

  it("ninguna skill está en aprendizaje activo (5 en standby comentadas)", () => {
    const learning = skills.filter((s) => s.status === "learning");
    expect(learning).toHaveLength(0);
  });

  it("las 16 skills activas NO llevan status learning", () => {
    for (const skill of skills) {
      expect(skill.status).toBeUndefined();
    }
  });

  it("los ids en standby (qwik, postgresql, prisma, graphql, jira) no están activos", () => {
    const activeIds = skills.map((s) => s.id);
    for (const standbyId of ["qwik", "postgresql", "prisma", "graphql", "jira"]) {
      expect(activeIds).not.toContain(standbyId);
    }
  });

  it("todos los iconos referenciados existen en /public/tech", () => {
    for (const skill of skills) {
      const file = path.join(__dirname, "../../../public", skill.icon);
      expect(
        existsSync(file),
        `Falta el icono ${skill.icon} de la skill "${skill.name}"`,
      ).toBe(true);
    }
  });

  it("skillCategoryLabels cubre exactamente las 3 categorías", () => {
    expect(Object.keys(skillCategoryLabels).sort()).toEqual(
      ["Backend", "Complementos", "Frontend"].sort(),
    );
  });

  it("las labels no están vacías", () => {
    for (const label of Object.values(skillCategoryLabels)) {
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });
});
