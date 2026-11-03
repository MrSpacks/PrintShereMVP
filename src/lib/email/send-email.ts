/**
 * Отправка писем через Resend (https://resend.com) — простой HTTP API, без SDK.
 *
 * Env:
 *   RESEND_API_KEY — ключ Resend. Без него письма не отправляются, только логируются.
 *   EMAIL_FROM     — отправитель, по умолчанию "PrintShare <support@3dprintshare.xyz>".
 *                    Домен отправителя должен быть подтверждён в Resend (DNS-записи).
 *   EMAIL_REPLY_TO — адрес для ответов, по умолчанию support@3dprintshare.xyz.
 */

import { PLATFORM_OPERATOR } from "@/lib/legal/constants";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  sent: boolean;
  skipped?: "not_configured";
  error?: string;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || `PrintShare <${PLATFORM_OPERATOR.email}>`;
}

export function getEmailReplyTo(): string {
  return process.env.EMAIL_REPLY_TO?.trim() || PLATFORM_OPERATOR.email;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Никогда не бросает исключение — ошибка письма не должна ломать заказ или чат. */
export async function sendEmail(message: EmailMessage): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.info(
      `[email] RESEND_API_KEY not set — skipped "${message.subject}" to ${message.to}`
    );
    return { sent: false, skipped: "not_configured" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getEmailFrom(),
        to: [message.to],
        reply_to: getEmailReplyTo(),
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[email] Resend ${response.status}: ${detail}`);
      return { sent: false, error: `HTTP ${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    console.error("[email] send failed", error);
    return { sent: false, error: "network" };
  }
}
