"use server";

import { db, clients, type NewClient, type Client } from "@/db";
import { eq, and, desc, ilike, or, isNull } from "drizzle-orm";
import { requireOrgAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "./activity";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

type ClientInput = z.infer<typeof clientSchema>;

export async function getClients(search?: string) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return [];
  }

  const baseCondition = eq(clients.organizationId, activeOrganization.id);

  const whereConditions = search
    ? and(
        baseCondition,
        or(
          ilike(clients.name, `%${search}%`),
          ilike(clients.email, `%${search}%`),
          ilike(clients.phone, `%${search}%`)
        )
      )
    : baseCondition;

  return db.query.clients.findMany({
    where: whereConditions,
    orderBy: [desc(clients.createdAt)],
  });
}

export async function getClient(id: string) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return null;
  }

  const client = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, id),
      eq(clients.organizationId, activeOrganization.id)
    ),
    with: {
      invoices: {
        orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
      },
    },
  });

  if (!client) return null;

  // Calculate invoice summary
  const invoiceSummary = {
    total: client.invoices.length,
    draft: client.invoices.filter((i) => i.status === "draft").length,
    sent: client.invoices.filter((i) => i.status === "sent").length,
    partial: client.invoices.filter((i) => i.status === "partial").length,
    paid: client.invoices.filter((i) => i.status === "paid").length,
    overdue: client.invoices.filter((i) => i.status === "overdue").length,
    cancelled: client.invoices.filter((i) => i.status === "cancelled").length,
    totalAmount: client.invoices
      .filter((i) => i.status !== "cancelled")
      .reduce((sum, i) => sum + parseFloat(i.total), 0),
    totalPaid: client.invoices
      .filter((i) => i.status !== "cancelled")
      .reduce((sum, i) => sum + parseFloat(i.amountPaid), 0),
  };

  return {
    ...client,
    invoiceSummary,
  };
}

export async function createClient(data: ClientInput) {
  const { user, activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return { success: false, error: "No active organization" };
  }

  const validated = clientSchema.parse(data);

  const [client] = await db
    .insert(clients)
    .values({
      ...validated,
      email: validated.email || null,
      userId: user.id,
      organizationId: activeOrganization.id,
    })
    .returning();

  // Log activity
  await logActivity({
    entityType: "client",
    entityId: client.id,
    entityName: client.name,
    action: "created",
    newValues: validated,
  });

  revalidatePath("/clients");
  return { success: true, client };
}

export async function updateClient(id: string, data: ClientInput) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return { success: false, error: "No active organization" };
  }

  const validated = clientSchema.parse(data);

  // Verify ownership
  const existing = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, id),
      eq(clients.organizationId, activeOrganization.id)
    ),
  });

  if (!existing) {
    return { success: false, error: "Client not found" };
  }

  const [client] = await db
    .update(clients)
    .set({
      ...validated,
      email: validated.email || null,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id))
    .returning();

  // Log activity with changes
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (existing.name !== validated.name)
    changes.name = { from: existing.name, to: validated.name };
  if (existing.email !== (validated.email || null))
    changes.email = { from: existing.email, to: validated.email };
  if (existing.phone !== validated.phone)
    changes.phone = { from: existing.phone, to: validated.phone };
  if (existing.address !== validated.address)
    changes.address = { from: existing.address, to: validated.address };

  await logActivity({
    entityType: "client",
    entityId: client.id,
    entityName: client.name,
    action: "updated",
    previousValues: {
      name: existing.name,
      email: existing.email,
      phone: existing.phone,
      address: existing.address,
    },
    newValues: validated,
    details: { changes },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { success: true, client };
}

export async function deleteClient(id: string) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return { success: false, error: "No active organization" };
  }

  // Verify ownership
  const existing = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, id),
      eq(clients.organizationId, activeOrganization.id)
    ),
  });

  if (!existing) {
    return { success: false, error: "Client not found" };
  }

  // Check if client has invoices
  const clientWithInvoices = await db.query.clients.findFirst({
    where: eq(clients.id, id),
    with: {
      invoices: {
        limit: 1,
      },
    },
  });

  if (clientWithInvoices?.invoices && clientWithInvoices.invoices.length > 0) {
    return {
      success: false,
      error: "Cannot delete client with existing invoices",
    };
  }

  await db.delete(clients).where(eq(clients.id, id));

  // Log activity
  await logActivity({
    entityType: "client",
    entityId: id,
    entityName: existing.name,
    action: "deleted",
    previousValues: {
      name: existing.name,
      email: existing.email,
      phone: existing.phone,
    },
  });

  revalidatePath("/clients");
  return { success: true };
}
