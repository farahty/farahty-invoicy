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
import { eq, and, desc, ilike, or, sql, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  const session = await requireAuth();

  let whereConditions = eq(invoices.userId, session.user.id);

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
  const session = await requireAuth();

  return db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.userId, session.user.id)),
    with: {
      client: true,
      items: {
        orderBy: (items, { asc }) => [asc(items.sortOrder)],
      },
    },
  });
}

export async function generateInvoiceNumber() {
  const session = await requireAuth();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  const prefix = user?.invoicePrefix || "INV";
  const nextNumber = user?.invoiceNextNumber || 1;
  const year = new Date().getFullYear();

  return `${prefix}-${year}-${String(nextNumber).padStart(4, "0")}`;
}

export async function createInvoice(data: InvoiceInput) {
  const session = await requireAuth();

  const validated = invoiceSchema.parse(data);

  // Verify client ownership
  const client = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, validated.clientId),
      eq(clients.userId, session.user.id)
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
      userId: session.user.id,
      clientId: validated.clientId,
      invoiceNumber,
      date: validated.date,
      dueDate: validated.dueDate,
      subtotal: subtotal.toFixed(2),
      taxRate: validated.taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
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

  // Increment invoice number for user
  await db
    .update(users)
    .set({
      invoiceNextNumber: sql`${users.invoiceNextNumber} + 1`,
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { success: true, invoice };
}

export async function updateInvoice(id: string, data: InvoiceInput) {
  const session = await requireAuth();

  const validated = invoiceSchema.parse(data);

  // Verify invoice ownership
  const existing = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.userId, session.user.id)),
  });

  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  // Verify client ownership
  const client = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, validated.clientId),
      eq(clients.userId, session.user.id)
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

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/dashboard");
  return { success: true, invoice };
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const session = await requireAuth();

  // Verify ownership
  const existing = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.userId, session.user.id)),
  });

  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  const updateData: Partial<NewInvoice> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "sent" && !existing.sentAt) {
    updateData.sentAt = new Date();
  }

  if (status === "paid" && !existing.paidAt) {
    updateData.paidAt = new Date();
  }

  await db.update(invoices).set(updateData).where(eq(invoices.id, id));

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteInvoice(id: string) {
  const session = await requireAuth();

  // Verify ownership
  const existing = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.userId, session.user.id)),
  });

  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  // Delete invoice (items will cascade)
  await db.delete(invoices).where(eq(invoices.id, id));

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getItemSuggestions(query: string) {
  const session = await requireAuth();

  // Get unique item descriptions from user's invoices
  // If query is empty, return recent items; otherwise filter by query
  const results = await db
    .selectDistinct({ description: invoiceItems.description })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .where(
      query && query.length > 0
        ? and(
            eq(invoices.userId, session.user.id),
            ilike(invoiceItems.description, `%${query}%`)
          )
        : eq(invoices.userId, session.user.id)
    )
    .limit(10);

  return results.map((r) => r.description);
}

export async function sendInvoiceEmail(invoiceId: string) {
  const session = await requireAuth();

  const invoice = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, invoiceId),
      eq(invoices.userId, session.user.id)
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

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    const formatted = value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ₪`;
  };

  // Send email
  try {
    await resend.emails.send({
      from: process.env.DEFAULT_FROM_EMAIL || "no-reply@farahty.com",
      to: invoice.client.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${
        user?.companyName || user?.name
      }`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin: 0;">Invoice ${
              invoice.invoiceNumber
            }</h1>
          </div>
          
          <p style="color: #666;">Dear ${invoice.client.name},</p>
          
          <p style="color: #666;">Please find attached your invoice for the amount of <strong>${formatCurrency(
            invoice.total
          )}</strong>.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Invoice Number:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${
                  invoice.invoiceNumber
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Due Date:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${new Date(
                  invoice.dueDate
                ).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Amount Due:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #0f172a;">${formatCurrency(
                  invoice.total
                )}</td>
              </tr>
            </table>
          </div>
          
          ${
            invoice.notes
              ? `<p style="color: #666; font-style: italic;">${invoice.notes}</p>`
              : ""
          }
          
          <p style="color: #666;">Thank you for your business!</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            ${user?.companyName || user?.name}<br />
            ${user?.companyAddress || ""}<br />
            ${user?.companyEmail || user?.email}
          </p>
        </div>
      `,
    });

    // Update invoice status to sent
    await updateInvoiceStatus(invoiceId, "sent");

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function duplicateInvoice(id: string) {
  const session = await requireAuth();

  const original = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.userId, session.user.id)),
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
      userId: session.user.id,
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

  // Increment invoice number
  await db
    .update(users)
    .set({
      invoiceNextNumber: sql`${users.invoiceNextNumber} + 1`,
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/invoices");
  return { success: true, invoice: newInvoice };
}
