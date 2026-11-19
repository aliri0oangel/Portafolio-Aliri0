import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MockEmailProvider } from "../emailService";

/**
 * Tests del proveedor de correo mock (Fase 4 — OWASP A01/PII).
 *
 * El logger de desarrollo NO debe exponer email ni nombre crudos
 * en stdout (A05: información sensible en logs). Solo metadatos
 * operativos: id, longitudes, subject acotado.
 */
describe("MockEmailProvider — PII en logs", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("devuelve success con id", async () => {
    const provider = new MockEmailProvider();
    const result = await provider.send({
      name: "Alirio Test",
      email: "alirio@example.com",
      subject: "Consulta General",
      message: "Hola, me interesa un proyecto web completo.",
    });
    expect(result.success).toBe(true);
    expect(result.id).toBeTruthy();
  });

  it("NO loguea el email del remitente (PII)", async () => {
    const provider = new MockEmailProvider();
    await provider.send({
      name: "Alirio Test",
      email: "pii-email@example.com",
      subject: "Consulta General",
      message: "Mensaje con datos sensibles.",
    });
    expect(infoSpy).toHaveBeenCalled();
    const logged = JSON.stringify(infoSpy.mock.calls);
    expect(logged).not.toContain("pii-email@example.com");
    expect(logged).not.toContain("@");
  });

  it("NO loguea el nombre completo del remitente (PII)", async () => {
    const provider = new MockEmailProvider();
    await provider.send({
      name: "Nombre Secreto Apellido",
      email: "x@example.com",
      subject: "Consulta General",
      message: "Mensaje.",
    });
    const logged = JSON.stringify(infoSpy.mock.calls);
    expect(logged).not.toContain("Nombre Secreto Apellido");
  });

  it("NO loguea el cuerpo del mensaje (podría contener PII)", async () => {
    const provider = new MockEmailProvider();
    await provider.send({
      name: "A B",
      email: "a@b.com",
      subject: "Consulta General",
      message: "Mi telefono es +58 412 000 0000 y vivo en Caracas.",
    });
    const logged = JSON.stringify(infoSpy.mock.calls);
    expect(logged).not.toContain("+58 412");
    expect(logged).not.toContain("Caracas");
  });

  it("loguea solo metadatos operativos (id, longitudes)", async () => {
    const provider = new MockEmailProvider();
    await provider.send({
      name: "A B",
      email: "a@b.com",
      subject: "Consulta General",
      message: "Mensaje de prueba largo suficiente.",
    });
    const line = infoSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(line).toHaveProperty("id");
    expect(line).toHaveProperty("subjectLength");
    expect(line).toHaveProperty("messageLength");
    expect(line).not.toHaveProperty("email");
    expect(line).not.toHaveProperty("from");
    expect(line).not.toHaveProperty("preview");
  });
});
