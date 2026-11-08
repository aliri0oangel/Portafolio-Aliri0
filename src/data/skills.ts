import type { ISkill, SkillCategory } from "@/types/skill";

/**
 * Matriz de competencias técnicas del portafolio (16 tecnologías activas).
 *
 * Cada skill referencia un SVG auto-hospedado en /public/tech para
 * cumplir la política de seguridad A08 (sin CDNs externos) y enlaza
 * a sus docs oficiales (los tiles son clicables).
 *
 * Ajuste 7 — STANDBY: las 5 tecnologías en proceso de aprendizaje
 * (Qwik, PostgreSQL, Prisma, GraphQL, Jira) quedan COMENTADAS con
 * la nota `// STANDBY` → 0 badges "En proceso" en la UI. Para
 * reactivarlas basta descomentar sus líneas (el badge naranja y
 * sus tests se ajustan automáticamente: SkillsSection cuenta por
 * data, no por literal).
 *
 * TypeScript y JavaScript aparecen en dos categorías a la vez
 * (Frontend y Backend); los ids solo deben ser únicos DENTRO de
 * cada categoría (los keys de React son por card).
 */
export const skills: ISkill[] = [
  // --- Frontend (8) ---
  { id: "html5", name: "HTML5", category: "Frontend", icon: "/tech/html5-original.svg", url: "https://developer.mozilla.org/es/docs/Web/HTML" },
  { id: "css3", name: "CSS3", category: "Frontend", icon: "/tech/css3-original.svg", url: "https://developer.mozilla.org/es/docs/Web/CSS" },
  { id: "javascript", name: "JavaScript", category: "Frontend", icon: "/tech/javascript-original.svg", url: "https://developer.mozilla.org/es/docs/Web/JavaScript" },
  { id: "react", name: "React", category: "Frontend", icon: "/tech/react-original.svg", url: "https://react.dev" },
  { id: "nextjs", name: "Next.js", category: "Frontend", icon: "/tech/nextjs-original.svg", url: "https://nextjs.org/docs" },
  { id: "tailwindcss", name: "Tailwind CSS", category: "Frontend", icon: "/tech/tailwindcss-original.svg", url: "https://tailwindcss.com/docs" },
  { id: "typescript", name: "TypeScript", category: "Frontend", icon: "/tech/typescript-original.svg", url: "https://www.typescriptlang.org/docs/" },
  { id: "vite", name: "Vite", category: "Frontend", icon: "/tech/vite-original.svg", url: "https://vite.dev/guide/" },

  // STANDBY (Ajuste 7): en aprendizaje — descomentar para reactivar el badge "En proceso"
  // { id: "qwik", name: "Qwik.js", category: "Frontend", icon: "/tech/qwik-original.svg", url: "https://qwik.dev/docs/", status: "learning" },

  // --- Backend (4) ---
  { id: "typescript", name: "TypeScript", category: "Backend", icon: "/tech/typescript-original.svg", url: "https://www.typescriptlang.org/docs/" },
  { id: "wordpress", name: "WordPress", category: "Backend", icon: "/tech/wordpress-original.svg", url: "https://developer.wordpress.org/docs/" },
  { id: "mongodb", name: "MongoDB", category: "Backend", icon: "/tech/mongodb-original.svg", url: "https://www.mongodb.com/docs/" },
  { id: "javascript", name: "JavaScript", category: "Backend", icon: "/tech/javascript-original.svg", url: "https://developer.mozilla.org/es/docs/Web/JavaScript" },
  // STANDBY (Ajuste 7): en aprendizaje — descomentar para reactivar los badges "En proceso"
  // { id: "postgresql", name: "PostgreSQL", category: "Backend", icon: "/tech/postgresql-original.svg", url: "https://www.postgresql.org/docs/", status: "learning" },
  // { id: "prisma", name: "Prisma ORM", category: "Backend", icon: "/tech/prisma-original.svg", url: "https://www.prisma.io/docs", status: "learning" },
  // { id: "graphql", name: "GraphQL", category: "Backend", icon: "/tech/graphql-original.svg", url: "https://graphql.org/learn/", status: "learning" },

  // --- Complementos (4) ---
  { id: "git", name: "Git", category: "Complementos", icon: "/tech/git-original.svg", url: "https://git-scm.com/doc" },
  { id: "github", name: "GitHub", category: "Complementos", icon: "/tech/github-original.svg", url: "https://docs.github.com/" },
  { id: "vscode", name: "Visual Studio Code", category: "Complementos", icon: "/tech/vscode-original.svg", url: "https://code.visualstudio.com/docs" },
  { id: "vercel", name: "Vercel", category: "Complementos", icon: "/tech/vercel-original.svg", url: "https://vercel.com/docs" },
  // STANDBY (Ajuste 7): en aprendizaje — descomentar para reactivar el badge "En proceso"
  // { id: "jira", name: "Jira", category: "Complementos", icon: "/tech/jira-original.svg", url: "https://support.atlassian.com/jira-software-cloud/docs/", status: "learning" },
];

/**
 * Etiquetas legibles de cada categoría de la matriz de habilidades.
 */
export const skillCategoryLabels: Record<SkillCategory, string> = {
  Frontend: "Frontend",
  Backend: "Backend",
  Complementos: "Complementos",
};
