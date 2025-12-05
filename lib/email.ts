import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailSenderInfo {
  organizationName?: string | null;
  organizationSlug?: string | null;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  senderInfo?: EmailSenderInfo;
}

/**
 * Get the email sender details based on organization info
 * Pattern:
 * - Name: organization name if available, otherwise "Invoicy"
 * - Email: {{organization.slug}}@farahty.com if available, otherwise invoicy@farahty.com
 */
export function getEmailSender(senderInfo?: EmailSenderInfo) {
  const defaultName = "Invoicy";
  const defaultEmail = "invoicy@farahty.com";

  const name = senderInfo?.organizationName || defaultName;
  const email = senderInfo?.organizationSlug
    ? `${senderInfo.organizationSlug}@farahty.com`
    : defaultEmail;

  return {
    from: `${name} <${email}>`,
    replyTo: `${name} <${email}>`,
  };
}

/**
 * Send an email using Resend with proper sender info
 */
export async function sendEmail(options: SendEmailOptions) {
  const { from, replyTo } = getEmailSender(options.senderInfo);

  return resend.emails.send({
    from,
    replyTo,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

/**
 * Email subject translations for different email types
 */
export const emailSubjects = {
  invitation: {
    en: (orgName: string) => `You've been invited to join ${orgName}`,
    ar: (orgName: string) => `تمت دعوتك للانضمام إلى ${orgName}`,
  },
  resetPassword: {
    en: "Reset your password",
    ar: "إعادة تعيين كلمة المرور",
  },
  invoice: {
    en: (invoiceNumber: string, companyName: string) =>
      `Invoice ${invoiceNumber} from ${companyName}`,
    ar: (invoiceNumber: string, companyName: string) =>
      `فاتورة ${invoiceNumber} من ${companyName}`,
  },
};
