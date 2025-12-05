"use server";

import { db, users } from "@/db";
import { requireAuth } from "@/lib/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface UserSettings {
  name: string;
  email: string;
  companyName: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  taxId: string | null;
  logoUrl: string | null;
  invoicePrefix: string | null;
  invoiceNextNumber: number | null;
}

export async function getSettings(): Promise<UserSettings | null> {
  const session = await requireAuth();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    companyName: user.companyName,
    companyAddress: user.companyAddress,
    companyPhone: user.companyPhone,
    companyEmail: user.companyEmail,
    taxId: user.taxId,
    logoUrl: user.logoUrl,
    invoicePrefix: user.invoicePrefix,
    invoiceNextNumber: user.invoiceNextNumber,
  };
}

export async function updateSettings(data: Partial<UserSettings>) {
  const session = await requireAuth();

  await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/settings");
  revalidatePath("/invoices");
  revalidatePath("/invoices/new");

  return { success: true };
}
