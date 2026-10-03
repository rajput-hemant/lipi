import { Resend } from "resend";

import { env } from "@/lib/env";

type Email = { to: string; subject: string; html: string; text: string };

/**
 * Server-only: sends through Resend. Without `RESEND_API_KEY` it logs the
 * message outside production (so reset links work locally) and throws in
 * production, where the message must never reach the console.
 */
export async function sendEmail({ to, subject, html, text }: Email) {
  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured");
    }
    console.info(`[email] To: ${to}\nSubject: ${subject}\n\n${text}`);
    return;
  }

  if (!env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is not configured");
  }

  const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend rejected the email: ${error.message}`);
  }
}
