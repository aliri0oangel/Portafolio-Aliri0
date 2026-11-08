import { escapeHtmlEntities } from "@/lib/sanitize";

/**
 * Adaptador desacoplado de despacho de correo (Dependency Inversion).
 *
 * La ruta de la API depende de esta interfaz abstracta, nunca de Resend
 * directamente: permite alternar entre Resend, Nodemailer o un mock de
 * desarrollo sin tocar el endpoint.
 */

/** Datos normalizados de un mensaje saliente. */
export interface IEmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** Resultado del despacho. */
export interface IEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Contrato de cualquier proveedor de correo.
 */
export interface IEmailProvider {
  send(payload: IEmailPayload): Promise<IEmailResult>;
}

/**
 * Implementación de desarrollo: simula el envío con latencia mínima y
 * registra el mensaje en consola del servidor. No requiere API keys.
 *
 * PLACEHOLDER: cuando exista `RESEND_API_KEY`, implementar `ResendEmailProvider`
 * cumpliendo `IEmailProvider` y seleccionarlo en `createEmailProvider`.
 */
export class MockEmailProvider implements IEmailProvider {
  async send(payload: IEmailPayload): Promise<IEmailResult> {
    // Simula latencia de red realista (~200ms) para que los estados de la
    // UI (Enviando... → Éxito) se comporten como en producción.
    await new Promise((resolve) => setTimeout(resolve, 200));

    const id = `mock_${Date.now().toString(36)}`;
    console.info("[email:mock] Mensaje de contacto recibido", {
      id,
      from: payload.email,
      name: escapeHtmlEntities(payload.name),
      subject: payload.subject,
      // Nunca registrar el cuerpo completo en producción con datos reales.
      preview: escapeHtmlEntities(payload.message).slice(0, 120),
    });

    return { success: true, id };
  }
}

/**
 * Factoría del proveedor de correo según variables de entorno.
 * Hoy solo existe el mock; el cambio a Resend será transparente.
 *
 * @returns Instancia lista para usar en el route handler.
 */
export function createEmailProvider(): IEmailProvider {
  // Futuro: si (process.env.RESEND_API_KEY) return new ResendEmailProvider(...)
  return new MockEmailProvider();
}
