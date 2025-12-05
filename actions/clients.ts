"use server";

import { db, clients, type NewClient, type Client } from "@/db";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { requireAuth } from "@/lib/session";
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
  const session = await requireAuth();

  const whereConditions = search
    ? and(
        eq(clients.userId, session.user.id),
        or(
          ilike(clients.name, `%${search}%`),
          ilike(clients.email, `%${search}%`),
          ilike(clients.phone, `%${search}%`)
        )
      )
    : eq(clients.userId, session.user.id);

  return db.query.clients.findMany({
    where: whereConditions,
    orderBy: [desc(clients.createdAt)],
  });
}

export async function getClient(id: string) {
  const session = await requireAuth();

  return db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.userId, session.user.id)),
    with: {
      invoices: {
        orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
        limit: 10,
      },
    },
  });
}

export async function createClient(data: ClientInput) {
  const session = await requireAuth();

  const validated = clientSchema.parse(data);

  const [client] = await db
    .insert(clients)
    .values({
      ...validated,
      email: validated.email || null,
      userId: session.user.id,
    })
    .returning();

  revalidatePath("/clients");
  return { success: true, client };
}

export async function updateClient(id: string, data: ClientInput) {
  const session = await requireAuth();

  const validated = clientSchema.parse(data);

  // Verify ownership
  const existing = await db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.userId, session.user.id)),
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
  const session = await requireAuth();

  // Verify ownership
  const existing = await db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.userId, session.user.id)),
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
