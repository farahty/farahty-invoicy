import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.DEFAULT_FROM_EMAIL || "no-reply@farahty.com",
        to: user.email,
        subject: "Reset your password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a;">Reset Your Password</h1>
            <p style="color: #666;">You requested to reset your password. Click the button below to set a new password:</p>
            <a href="${url}" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
            <p style="color: #999; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} Farahty Invoice App</p>
          </div>
        `,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      companyName: {
        type: "string",
        required: false,
      },
      companyAddress: {
        type: "string",
        required: false,
      },
      companyPhone: {
        type: "string",
        required: false,
      },
      companyEmail: {
        type: "string",
        required: false,
      },
      taxId: {
        type: "string",
        required: false,
      },
      logoUrl: {
        type: "string",
        required: false,
      },
      invoicePrefix: {
        type: "string",
        required: false,
        defaultValue: "INV",
      },
      invoiceNextNumber: {
        type: "number",
        required: false,
        defaultValue: 1,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
