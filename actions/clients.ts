"use server";

import { db, clients, type NewClient, type Client } from "@/db";
import { eq, and, desc, ilike, or, isNull } from "drizzle-orm";
import { requireOrgAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

  return db.query.clients.findFirst({
    where: and(
      eq(clients.id, id),
      eq(clients.organizationId, activeOrganization.id)
    ),
    with: {
      invoices: {
        orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
        limit: 10,
      },
    },
  });
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

  revalidatePath("/clients");
  return { success: true };
}
