import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendEmail, emailSubjects } from "./email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
    },
  }),
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      membershipLimit: 100,
      invitationExpiresIn: 60 * 60 * 48, // 48 hours
      async sendInvitationEmail(data) {
        const inviteLink = `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/accept-invitation/${data.id}`;

        await sendEmail({
          to: data.email,
          subject: emailSubjects.invitation.en(data.organization.name),
          senderInfo: {
            organizationName: data.organization.name,
            organizationSlug: data.organization.slug,
          },
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1a1a1a;">You're Invited!</h1>
              <p style="color: #666;">${
                data.inviter.user.name
              } has invited you to join <strong>${
            data.organization.name
          }</strong>.</p>
              <a href="${inviteLink}" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
              <p style="color: #999; font-size: 14px;">This invitation will expire in 48 hours.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} ${
            data.organization.name
          }</p>
            </div>
          `,
        });
      },
      schema: {
        organization: {
          additionalFields: {
            address: {
              type: "string",
              required: false,
            },
            phone: {
              type: "string",
              required: false,
            },
            email: {
              type: "string",
              required: false,
            },
            taxId: {
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
      },
    }),
  ],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Set active organization to user's last visited org or first org
          const member = await db.query.members.findFirst({
            where: (members, { eq }) => eq(members.userId, session.userId),
            orderBy: (members, { desc }) => [desc(members.createdAt)],
          });
          return {
            data: {
              ...session,
              activeOrganizationId: member?.organizationId || null,
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: emailSubjects.resetPassword.en,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a;">Reset Your Password</h1>
            <p style="color: #666;">You requested to reset your password. Click the button below to set a new password:</p>
            <a href="${url}" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
            <p style="color: #999; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} Invoicy</p>
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
