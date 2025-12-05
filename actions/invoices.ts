"use server";

import {
  db,
  invoices,
  invoiceItems,
  clients,
  users,
  type NewInvoice,
  type NewInvoiceItem,
  type InvoiceStatus,
} from "@/db";
import { organizations, payments } from "@/db/schema";
import { eq, and, desc, ilike, or, sql, inArray } from "drizzle-orm";
import { requireOrgAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendEmail, emailSubjects } from "@/lib/email";
import { logActivity } from "./activity";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  rate: z.coerce.number().min(0, "Rate must be 0 or greater"),
});

const invoiceSchema = z.object({
  clientId: z.string().uuid("Please select a client"),
  date: z.coerce.date(),
  dueDate: z.coerce.date(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

type InvoiceInput = z.infer<typeof invoiceSchema>;

export async function getInvoices(filters?: {
  search?: string;
  status?: InvoiceStatus;
  clientId?: string;
}) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return [];
  }

  let whereConditions = eq(invoices.organizationId, activeOrganization.id);

  if (filters?.status) {
    whereConditions = and(
      whereConditions,
      eq(invoices.status, filters.status)
    )!;
  }

  if (filters?.clientId) {
    whereConditions = and(
      whereConditions,
      eq(invoices.clientId, filters.clientId)
    )!;
  }

  const results = await db.query.invoices.findMany({
    where: whereConditions,
    with: {
      client: true,
    },
    orderBy: [desc(invoices.createdAt)],
  });

  // Filter by search term if provided
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    return results.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.client.name.toLowerCase().includes(searchLower)
    );
  }

  return results;
}

export async function getInvoice(id: string) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return null;
  }

  return db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, activeOrganization.id)
    ),
    with: {
      client: true,
      items: {
        orderBy: (items, { asc }) => [asc(items.sortOrder)],
      },
      payments: {
        orderBy: (payments, { desc }) => [desc(payments.paymentDate)],
      },
    },
  });
}

export async function generateInvoiceNumber() {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    throw new Error("No active organization");
  }

  // Get organization for invoice settings
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, activeOrganization.id),
  });

  const prefix = org?.invoicePrefix || "INV";
  const nextNumber = org?.invoiceNextNumber || 1;
  const year = new Date().getFullYear();

  return `${prefix}-${year}-${String(nextNumber).padStart(4, "0")}`;
}

export async function createInvoice(data: InvoiceInput) {
  const { user, activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return { success: false, error: "No active organization" };
  }

  const validated = invoiceSchema.parse(data);

  // Verify client ownership
  const client = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, validated.clientId),
      eq(clients.organizationId, activeOrganization.id)
    ),
  });

  if (!client) {
    return { success: false, error: "Client not found" };
  }

  // Calculate totals
  const subtotal = validated.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
  const taxAmount = (subtotal * validated.taxRate) / 100;
  const total = subtotal + taxAmount;

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Create invoice and items in a transaction-like manner
  const [invoice] = await db
    .insert(invoices)
    .values({
      userId: user.id,
      organizationId: activeOrganization.id,
      clientId: validated.clientId,
      invoiceNumber,
      date: validated.date,
      dueDate: validated.dueDate,
      subtotal: subtotal.toFixed(2),
      taxRate: validated.taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      amountPaid: "0",
      balanceDue: total.toFixed(2),
      notes: validated.notes,
      terms: validated.terms,
      status: "draft",
    })
    .returning();

  // Insert items
  const itemsToInsert = validated.items.map((item, index) => ({
    invoiceId: invoice.id,
    description: item.description,
    quantity: String(Math.round(item.quantity)),
    rate: item.rate.toFixed(2),
    amount: (item.quantity * item.rate).toFixed(2),
    sortOrder: index,
  }));

  await db.insert(invoiceItems).values(itemsToInsert);

  // Increment invoice number for organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, activeOrganization.id),
  });
  const currentNextNumber = org?.invoiceNextNumber || 1;

  await db
    .update(organizations)
    .set({
      invoiceNextNumber: currentNextNumber + 1,
    })
    .where(eq(organizations.id, activeOrganization.id));

  // Log activity
  await logActivity({
    entityType: "invoice",
    entityId: invoice.id,
    entityName: invoice.invoiceNumber,
    action: "created",
    newValues: {
      invoiceNumber: invoice.invoiceNumber,
      clientId: validated.clientId,
      total: total.toFixed(2),
      itemCount: validated.items.length,
    },
    details: {
      clientName: client.name,
      subtotal: subtotal.toFixed(2),
      taxRate: validated.taxRate,
      taxAmount: taxAmount.toFixed(2),
    },
  });

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { success: true, invoice };
}

export async function updateInvoice(id: string, data: InvoiceInput) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return { success: false, error: "No active organization" };
  }

  const validated = invoiceSchema.parse(data);

  // Verify invoice ownership
  const existing = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, activeOrganization.id)
    ),
  });

  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  // Verify client ownership
  const client = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, validated.clientId),
      eq(clients.organizationId, activeOrganization.id)
    ),
  });

  if (!client) {
    return { success: false, error: "Client not found" };
  }

  // Calculate totals
  const subtotal = validated.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
  const taxAmount = (subtotal * validated.taxRate) / 100;
  const total = subtotal + taxAmount;

  // Calculate new balance due (total - amount already paid)
  const amountPaid = parseFloat(existing.amountPaid);
  const newBalanceDue = total - amountPaid;

  // Determine status based on payment
  let newStatus = existing.status;
  if (newBalanceDue <= 0 && amountPaid > 0) {
    newStatus = "paid";
  } else if (amountPaid > 0 && newBalanceDue > 0) {
    newStatus = "partial";
  }

  // Update invoice
  const [invoice] = await db
    .update(invoices)
    .set({
      clientId: validated.clientId,
      date: validated.date,
      dueDate: validated.dueDate,
      subtotal: subtotal.toFixed(2),
      taxRate: validated.taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      balanceDue: newBalanceDue.toFixed(2),
      status: newStatus,
      notes: validated.notes,
      terms: validated.terms,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id))
    .returning();

  // Delete existing items and insert new ones
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

  const itemsToInsert = validated.items.map((item, index) => ({
    invoiceId: invoice.id,
    description: item.description,
    quantity: String(Math.round(item.quantity)),
    rate: item.rate.toFixed(2),
    amount: (item.quantity * item.rate).toFixed(2),
    sortOrder: index,
  }));

  await db.insert(invoiceItems).values(itemsToInsert);

  // Log activity
  await logActivity({
    entityType: "invoice",
    entityId: invoice.id,
    entityName: invoice.invoiceNumber,
    action: "updated",
    previousValues: {
      total: existing.total,
      status: existing.status,
      itemCount: "unknown", // We don't have previous items count easily
    },
    newValues: {
      total: total.toFixed(2),
      status: newStatus,
      itemCount: validated.items.length,
    },
    details: {
      totalChanged: existing.total !== total.toFixed(2),
      statusChanged: existing.status !== newStatus,
    },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/dashboard");
  return { success: true, invoice };
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return { success: false, error: "No active organization" };
  }

  // Prevent direct status change to "paid" - must be done via payments
  if (status === "paid") {
    return {
      success: false,
      error: "Invoice can only be marked as paid through payments",
    };
  }

  // Verify ownership
  const existing = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, activeOrganization.id)
    ),
  });

  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  // Skip if status is already the same
  if (existing.status === status) {
    return { success: true };
  }

  const updateData: Partial<NewInvoice> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "sent" && !existing.sentAt) {
    updateData.sentAt = new Date();
  }

  // When cancelling an invoice, delete all payments and reset amounts
  if (status === "cancelled") {
    // Delete all payments for this invoice
    await db.delete(payments).where(eq(payments.invoiceId, id));

    // Reset payment amounts
    updateData.amountPaid = "0";
    updateData.balanceDue = existing.total;
    updateData.paidAt = null;
  }

  await db.update(invoices).set(updateData).where(eq(invoices.id, id));

  // Log activity
  await logActivity({
    entityType: "invoice",
    entityId: id,
    entityName: existing.invoiceNumber,
    action: "status_changed",
    previousValues: { status: existing.status },
    newValues: { status },
    details: {
      fromStatus: existing.status,
      toStatus: status,
      paymentsDeleted: status === "cancelled",
    },
  });

  // Update client balance if status changed
  if (
    status === "cancelled" ||
    existing.status === "paid" ||
    existing.status === "partial"
  ) {
    const { recalculateClientBalance } = await import("./payments");
    await recalculateClientBalance(existing.clientId);
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteInvoice(id: string) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return { success: false, error: "No active organization" };
  }

  // Verify ownership
  const existing = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, activeOrganization.id)
    ),
  });

  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  // Delete invoice (items will cascade)
  await db.delete(invoices).where(eq(invoices.id, id));

  // Log activity
  await logActivity({
    entityType: "invoice",
    entityId: id,
    entityName: existing.invoiceNumber,
    action: "deleted",
    previousValues: {
      invoiceNumber: existing.invoiceNumber,
      clientId: existing.clientId,
      total: existing.total,
      status: existing.status,
    },
  });

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getItemSuggestions(query: string) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return [];
  }

  // Get unique item descriptions from organization's invoices
  // If query is empty, return recent items; otherwise filter by query
  const results = await db
    .selectDistinct({ description: invoiceItems.description })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .where(
      query && query.length > 0
        ? and(
            eq(invoices.organizationId, activeOrganization.id),
            ilike(invoiceItems.description, `%${query}%`)
          )
        : eq(invoices.organizationId, activeOrganization.id)
    )
    .limit(10);

  return results.map((r) => r.description);
}

export async function sendInvoiceEmail(invoiceId: string, locale?: string) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return { success: false, error: "No active organization" };
  }

  // Get locale from cookie if not provided
  if (!locale) {
    const { getLocale } = await import("./locale");
    locale = await getLocale();
  }

  const isRTL = locale === "ar";

  // Email translations
  const translations = {
    en: {
      greeting: (clientName: string) => `Dear ${clientName},`,
      intro: (amount: string) =>
        `Please find your invoice for the amount of <strong>${amount}</strong>.`,
      invoiceNumber: "Invoice Number",
      dueDate: "Due Date",
      amountDue: "Amount Due",
      thankYou: "Thank you for your business!",
    },
    ar: {
      greeting: (clientName: string) => `عزيزي ${clientName}،`,
      intro: (amount: string) =>
        `يرجى الاطلاع على فاتورتك بمبلغ <strong>${amount}</strong>.`,
      invoiceNumber: "رقم الفاتورة",
      dueDate: "تاريخ الاستحقاق",
      amountDue: "المبلغ المستحق",
      thankYou: "شكراً لتعاملكم معنا!",
    },
  };

  const t =
    translations[locale as keyof typeof translations] || translations.en;

  const invoice = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, invoiceId),
      eq(invoices.organizationId, activeOrganization.id)
    ),
    with: {
      client: true,
      items: true,
    },
  });

  if (!invoice) {
    return { success: false, error: "Invoice not found" };
  }

  if (!invoice.client.email) {
    return { success: false, error: "Client has no email address" };
  }

  // Get organization for company info
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, activeOrganization.id),
  });
  const companyName = org?.name || "";
  const companyAddress = org?.address || "";
  const companyEmail = org?.email || "";

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    const formatted = value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ₪`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString(locale === "ar" ? "ar-PS" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // RTL-aware styles
  const direction = isRTL ? "rtl" : "ltr";
  const textAlign = isRTL ? "right" : "left";
  const textAlignOpposite = isRTL ? "left" : "right";

  // Send email
  try {
    // Get subject based on locale
    const subject =
      locale === "ar"
        ? emailSubjects.invoice.ar(invoice.invoiceNumber, companyName)
        : emailSubjects.invoice.en(invoice.invoiceNumber, companyName);

    await sendEmail({
      to: invoice.client.email,
      subject,
      senderInfo: {
        organizationName: org?.name,
        organizationSlug: org?.slug,
      },
      html: `
        <div dir="${direction}" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: ${direction};">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin: 0;">${companyName}</h1>
            <p style="color: #666; margin-top: 8px;">${
              invoice.invoiceNumber
            }</p>
          </div>
          
          <p style="color: #666; text-align: ${textAlign};">${t.greeting(
        invoice.client.name
      )}</p>
          
          <p style="color: #666; text-align: ${textAlign};">${t.intro(
        formatCurrency(invoice.total)
      )}</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; text-align: ${textAlign};">${
        t.invoiceNumber
      }</td>
                <td style="padding: 8px 0; text-align: ${textAlignOpposite}; font-weight: bold;">${
        invoice.invoiceNumber
      }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; text-align: ${textAlign};">${
        t.dueDate
      }</td>
                <td style="padding: 8px 0; text-align: ${textAlignOpposite}; font-weight: bold;">${formatDate(
        invoice.dueDate
      )}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; text-align: ${textAlign};">${
        t.amountDue
      }</td>
                <td style="padding: 8px 0; text-align: ${textAlignOpposite}; font-weight: bold; color: #0f172a;">${formatCurrency(
        invoice.balanceDue
      )}</td>
              </tr>
            </table>
          </div>
          
          ${
            invoice.notes
              ? `<p style="color: #666; font-style: italic; text-align: ${textAlign};">${invoice.notes}</p>`
              : ""
          }
          
          <p style="color: #666; text-align: ${textAlign};">${t.thankYou}</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            ${companyName}<br />
            ${companyAddress ? `${companyAddress}<br />` : ""}
            ${companyEmail}
          </p>
        </div>
      `,
    });

    // Update invoice status to sent only if it's a draft
    if (invoice.status === "draft") {
      await updateInvoiceStatus(invoiceId, "sent");
    }

    // Log activity
    await logActivity({
      entityType: "invoice",
      entityId: invoiceId,
      entityName: invoice.invoiceNumber,
      action: "sent",
      details: {
        recipientEmail: invoice.client.email,
        invoiceTotal: invoice.total,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function duplicateInvoice(id: string) {
  const { user, activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return { success: false, error: "No active organization" };
  }

  const original = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, activeOrganization.id)
    ),
    with: {
      items: true,
    },
  });

  if (!original) {
    return { success: false, error: "Invoice not found" };
  }

  // Create new invoice with same data
  const invoiceNumber = await generateInvoiceNumber();

  const [newInvoice] = await db
    .insert(invoices)
    .values({
      userId: user.id,
      organizationId: activeOrganization.id,
      clientId: original.clientId,
      invoiceNumber,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subtotal: original.subtotal,
      taxRate: original.taxRate,
      taxAmount: original.taxAmount,
      total: original.total,
      notes: original.notes,
      terms: original.terms,
      status: "draft",
    })
    .returning();

  // Copy items
  const itemsToInsert = original.items.map((item) => ({
    invoiceId: newInvoice.id,
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.amount,
    sortOrder: item.sortOrder,
  }));

  await db.insert(invoiceItems).values(itemsToInsert);

  // Increment invoice number for organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, activeOrganization.id),
  });
  const currentNextNumber = org?.invoiceNextNumber || 1;

  await db
    .update(organizations)
    .set({
      invoiceNextNumber: currentNextNumber + 1,
    })
    .where(eq(organizations.id, activeOrganization.id));

  revalidatePath("/invoices");
  return { success: true, invoice: newInvoice };
}
