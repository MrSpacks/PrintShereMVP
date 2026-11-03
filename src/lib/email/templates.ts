import type { EmailMessage } from "@/lib/email/send-email";

/**
 * Письма двуязычные (CZ + EN): язык интерфейса хранится только в браузере,
 * поэтому на сервере мы не знаем, какой язык выбрал получатель.
 */
export interface LocalizedText {
  cs: string;
  en: string;
}

export interface EmailContent {
  to: string;
  subject: LocalizedText;
  /** Абзацы письма; каждый — пара CZ/EN */
  paragraphs: LocalizedText[];
  /** Необязательная цитата (например, текст сообщения из чата) */
  quote?: string;
  button?: { url: string; label: LocalizedText };
  /** Мелкий текст внизу */
  footnote?: LocalizedText;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BRAND_COLOR = "#2563eb";

function renderSection(
  lang: "cs" | "en",
  content: EmailContent
): { html: string; text: string } {
  const paragraphs = content.paragraphs.map((p) => p[lang]);
  const htmlParts = paragraphs.map(
    (p) =>
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#111827">${escapeHtml(p)}</p>`
  );
  const textParts = [...paragraphs];

  if (content.quote) {
    htmlParts.push(
      `<blockquote style="margin:0 0 12px;padding:8px 12px;border-left:3px solid #d1d5db;color:#374151;font-size:14px;white-space:pre-wrap">${escapeHtml(content.quote)}</blockquote>`
    );
    textParts.push(`> ${content.quote.replace(/\n/g, "\n> ")}`);
  }

  if (content.button) {
    htmlParts.push(
      `<p style="margin:16px 0"><a href="${escapeHtml(content.button.url)}" style="display:inline-block;padding:10px 18px;border-radius:6px;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px">${escapeHtml(content.button.label[lang])}</a></p>`
    );
    textParts.push(`${content.button.label[lang]}: ${content.button.url}`);
  }

  if (content.footnote) {
    htmlParts.push(
      `<p style="margin:12px 0 0;font-size:12px;color:#6b7280">${escapeHtml(content.footnote[lang])}</p>`
    );
    textParts.push(content.footnote[lang]);
  }

  return { html: htmlParts.join("\n"), text: textParts.join("\n\n") };
}

export function buildEmail(content: EmailContent): EmailMessage {
  const cs = renderSection("cs", content);
  const en = renderSection("en", content);

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:10px;padding:24px">
<p style="margin:0 0 16px;font-size:18px;font-weight:700;color:${BRAND_COLOR}">PrintShare</p>
${cs.html}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
<p style="margin:0 0 8px;font-size:12px;color:#6b7280">English</p>
${en.html}
</div>
</body></html>`;

  const text = `${cs.text}\n\n---\nEnglish\n\n${en.text}\n`;

  return {
    to: content.to,
    subject: `${content.subject.cs} / ${content.subject.en}`,
    html,
    text,
  };
}
