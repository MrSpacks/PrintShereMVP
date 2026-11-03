import { NextResponse } from "next/server";

import { isValidEmail } from "@/lib/auth/password";
import {
  createPasswordResetToken,
  isPasswordResetThrottled,
  PASSWORD_RESET_TTL_MINUTES,
} from "@/lib/auth/password-reset";
import { sendEmail } from "@/lib/email/send-email";
import { buildEmail } from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site";

/**
 * POST /api/auth/password/forgot { email }
 * Всегда отвечает 200, чтобы по ответу нельзя было узнать, есть ли такой аккаунт.
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const rawEmail =
      body && typeof body === "object"
        ? (body as { email?: unknown }).email
        : undefined;

    if (typeof rawEmail !== "string" || !isValidEmail(rawEmail.trim())) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();

    if (!isPasswordResetThrottled(email)) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, passwordHash: true },
      });

      if (user) {
        const token = await createPasswordResetToken(user);
        const url = `${getSiteUrl()}/reset-password?token=${encodeURIComponent(token)}`;

        await sendEmail(
          buildEmail({
            to: user.email,
            subject: { cs: "Obnovení hesla", en: "Reset your password" },
            paragraphs: [
              { cs: `Dobrý den, ${user.name}!`, en: `Hi ${user.name}!` },
              {
                cs: `Někdo (pravděpodobně vy) požádal o nastavení nového hesla k účtu PrintShare. Odkaz platí ${PASSWORD_RESET_TTL_MINUTES} minut a lze ho použít jen jednou.`,
                en: `Someone (probably you) asked to set a new password for your PrintShare account. The link is valid for ${PASSWORD_RESET_TTL_MINUTES} minutes and works only once.`,
              },
            ],
            button: {
              url,
              label: { cs: "Nastavit nové heslo", en: "Set a new password" },
            },
            footnote: {
              cs: "Pokud jste o změnu nežádali, tento e-mail ignorujte — vaše heslo zůstane beze změny.",
              en: "If you didn't ask for this, ignore this email — your password will stay the same.",
            },
          })
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/auth/password/forgot]", error);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
