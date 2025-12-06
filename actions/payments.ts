"use server";

import { db, dbPool } from "@/db";
import { payments, invoices, clients, PaymentMethod } from "@/db/schema";
import { eq, sql, desc, and, ne, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOrgAuth } from "@/lib/session";
import { logActivity } from "./activity";

// ============================================
// Payment Actions
// ============================================

export async function recordPayment(data: {
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
}) {
  const { user, activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return { error: "No active organization" };
  }

  // Get the invoice
  const invoice = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, data.invoiceId),
      eq(invoices.organizationId, activeOrganization.id)
    ),
  });

  if (!invoice) {
    return { error: "Invoice not found" };
  }

  const balanceDue = parseFloat(invoice.balanceDue);
  const paymentAmount = data.amount;

  if (paymentAmount <= 0) {
    return { error: "Payment amount must be greater than 0" };
  }

  if (paymentAmount > balanceDue) {
    return { error: "Payment amount cannot exceed balance due" };
  }

  // Calculate new values
  const newAmountPaid = parseFloat(invoice.amountPaid) + paymentAmount;
  const newBalanceDue = parseFloat(invoice.total) - newAmountPaid;

  // Determine new status
  let newStatus = invoice.status;
  if (newBalanceDue <= 0) {
    newStatus = "paid";
  } else if (newAmountPaid > 0) {
    newStatus = "partial";
  }

  try {
    // Use transaction to ensure all updates succeed or fail together
    const payment = await dbPool.transaction(async (tx) => {
      // Create payment record
      const [payment] = await tx
        .insert(payments)
        .values({
          invoiceId: data.invoiceId,
          organizationId: activeOrganization.id,
          amount: paymentAmount.toString(),
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
          createdBy: user.id,
        })
        .returning();

      // Update invoice amounts
      await tx
        .update(invoices)
        .set({
          amountPaid: newAmountPaid.toString(),
          balanceDue: newBalanceDue.toString(),
          status: newStatus,
          paidAt: newStatus === "paid" ? new Date() : invoice.paidAt,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, data.invoiceId));

      // Recalculate client balance within transaction
      const clientInvoices = await tx.query.invoices.findMany({
        where: eq(invoices.clientId, invoice.clientId),
      });

      const totalBalance = clientInvoices
        .filter((inv) => inv.status !== "cancelled")
        .reduce((sum, inv) => {
          // Use updated balance for current invoice
          if (inv.id === data.invoiceId) {
            return sum + newBalanceDue;
          }
          return sum + parseFloat(inv.balanceDue);
        }, 0);

      await tx
        .update(clients)
        .set({
          balance: totalBalance.toString(),
          updatedAt: new Date(),
        })
        .where(eq(clients.id, invoice.clientId));

      return payment;
    });

    // Log activity for the payment (outside transaction since it's not critical)
    await logActivity({
      entityType: "payment",
      entityId: payment.id,
      entityName: `₪${paymentAmount.toLocaleString()}`,
      action: "payment_recorded",
      newValues: {
        amount: paymentAmount,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
      },
      details: {
        invoiceId: data.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        previousBalance: balanceDue,
        newBalance: newBalanceDue,
        invoiceStatus: newStatus,
      },
    });

    revalidatePath(`/invoices/${data.invoiceId}`);
    revalidatePath("/invoices");
    revalidatePath("/clients");
    revalidatePath("/dashboard");

    return { success: true, payment };
  } catch (error) {
    console.error("Failed to record payment:", error);
    return { error: "Failed to record payment. Please try again." };
  }
}

export async function getPaymentsByInvoice(invoiceId: string) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return [];
  }

  const invoicePayments = await db.query.payments.findMany({
    where: and(
      eq(payments.invoiceId, invoiceId),
      eq(payments.organizationId, activeOrganization.id),
      isNull(payments.deletedAt)
    ),
    with: {
      createdByUser: true,
    },
    orderBy: [desc(payments.paymentDate)],
  });

  return invoicePayments;
}

export async function deletePayment(paymentId: string) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return { error: "No active organization" };
  }

  // Get the payment (only if not already deleted)
  const payment = await db.query.payments.findFirst({
    where: and(
      eq(payments.id, paymentId),
      eq(payments.organizationId, activeOrganization.id),
      isNull(payments.deletedAt)
    ),
  });

  if (!payment) {
    return { error: "Payment not found" };
  }

  // Get the invoice
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, payment.invoiceId),
  });

  if (!invoice) {
    return { error: "Invoice not found" };
  }

  // Execute all database operations in a transaction
  const result = await dbPool.transaction(async (tx) => {
    // Soft-delete the payment
    await tx
      .update(payments)
      .set({ deletedAt: new Date() })
      .where(eq(payments.id, paymentId));

    // Recalculate invoice amounts (excluding soft-deleted payments)
    const remainingPayments = await tx.query.payments.findMany({
      where: and(
        eq(payments.invoiceId, payment.invoiceId),
        isNull(payments.deletedAt)
      ),
    });

    const totalPaid = remainingPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount),
      0
    );
    const newBalanceDue = parseFloat(invoice.total) - totalPaid;

    // Determine new status
    let newStatus = invoice.status;
    if (newBalanceDue <= 0 && totalPaid > 0) {
      newStatus = "paid";
    } else if (totalPaid > 0) {
      newStatus = "partial";
    } else {
      // Revert to sent or draft based on sentAt
      newStatus = invoice.sentAt ? "sent" : "draft";
    }

    await tx
      .update(invoices)
      .set({
        amountPaid: totalPaid.toString(),
        balanceDue: newBalanceDue.toString(),
        status: newStatus,
        paidAt: newStatus === "paid" ? invoice.paidAt : null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, payment.invoiceId));

    // Recalculate client balance within transaction
    const clientInvoices = await tx.query.invoices.findMany({
      where: and(
        eq(invoices.clientId, invoice.clientId),
        ne(invoices.status, "cancelled")
      ),
    });

    const totalBalance = clientInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.balanceDue),
      0
    );

    await tx
      .update(clients)
      .set({
        balance: totalBalance.toString(),
        updatedAt: new Date(),
      })
      .where(eq(clients.id, invoice.clientId));

    return { newStatus, newBalanceDue };
  });

  // Log activity outside transaction (non-critical)
  await logActivity({
    entityType: "payment",
    entityId: payment.id,
    entityName: `₪${parseFloat(payment.amount).toLocaleString()}`,
    action: "payment_deleted",
    previousValues: {
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
    },
    details: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      newInvoiceStatus: result.newStatus,
      newBalanceDue: result.newBalanceDue,
    },
  });

  revalidatePath(`/invoices/${payment.invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function recalculateClientBalance(clientId: string) {
  // Get all non-cancelled invoices for this client
  const clientInvoices = await db.query.invoices.findMany({
    where: and(
      eq(invoices.clientId, clientId),
      ne(invoices.status, "cancelled")
    ),
  });

  // Sum up all balance due amounts
  const totalBalance = clientInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.balanceDue),
    0
  );

  // Update client balance
  await db
    .update(clients)
    .set({
      balance: totalBalance.toString(),
      updatedAt: new Date(),
    })
    .where(eq(clients.id, clientId));

  return totalBalance;
}

export async function getPaymentStats() {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return null;
  }

  // Get payment statistics (excluding soft-deleted payments)
  const stats = await db
    .select({
      totalPayments: sql<number>`count(*)`,
      totalAmount: sql<number>`coalesce(sum(${payments.amount}::numeric), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, activeOrganization.id),
        isNull(payments.deletedAt)
      )
    );

  return stats[0];
}
