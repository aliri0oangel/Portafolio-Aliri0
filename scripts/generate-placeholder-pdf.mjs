// Genera un PDF mínimo y válido como placeholder del CV.
// Reemplazar public/cv/alirio-cv.pdf por el CV real del propietario.
// Uso: node scripts/generate-placeholder-pdf.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..", "public", "cv");
fs.mkdirSync(dir, { recursive: true });

const lines = [
  "ALIRIO - Desarrollador Web Full-Stack",
  "",
  "PLACEHOLDER - Reemplaza este archivo por tu CV real.",
  "Ruta: public/cv/alirio-cv.pdf",
];

const contentStream = [
  "BT",
  "/F1 18 Tf",
  "50 780 Td",
  `(${lines[0]}) Tj`,
  "/F1 12 Tf",
  ...lines.slice(1).map((l) => `0 -24 Td (${l}) Tj`),
  "ET",
].join("\n");

const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
];

let pdf = "%PDF-1.4\n";
const offsets = [0];

objects.forEach((obj, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
});

const xrefStart = pdf.length;
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += "0000000000 65535 f \n";
offsets.slice(1).forEach((off) => {
  pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
});
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

const out = path.join(dir, "alirio-cv.pdf");
fs.writeFileSync(out, pdf, "latin1");
console.log("PDF generado:", out);
