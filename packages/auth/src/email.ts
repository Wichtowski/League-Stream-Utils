import type { Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import nodemailer from "nodemailer";

import type { Database } from "@lsu/db/types";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

const FROM = process.env.SMTP_FROM ?? "LSU <noreply@localhost>";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function generateVerificationToken(
  db: Kysely<Database>,
  userId: string,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db
    .insertInto("email_verification_tokens")
    .values({ user_id: userId, token, expires_at: expiresAt })
    .execute();

  return token;
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Verify your email – League Stream Utils",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #6366f1;">League Stream Utils</h2>
        <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">Verify Email</a>
        <p style="margin-top: 16px; font-size: 12px; color: #888;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function verifyEmail(db: Kysely<Database>, token: string) {
  const record = await db
    .selectFrom("email_verification_tokens")
    .selectAll()
    .where("token", "=", token)
    .where("expires_at", ">", new Date())
    .executeTakeFirst();

  if (!record) return { success: false as const, error: "Invalid or expired token" };

  await db
    .updateTable("users")
    .set({ email_verified: true })
    .where("id", "=", record.user_id)
    .execute();

  await db.deleteFrom("email_verification_tokens").where("user_id", "=", record.user_id).execute();

  return { success: true as const };
}

export async function resendVerificationEmail(db: Kysely<Database>, userId: string, email: string) {
  await db.deleteFrom("email_verification_tokens").where("user_id", "=", userId).execute();

  const token = await generateVerificationToken(db, userId);
  await sendVerificationEmail(email, token);
}
