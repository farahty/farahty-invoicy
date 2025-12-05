"use server";

import { db, users } from "@/db";
import { organizations } from "@/db/schema";
import { requireAuth, requireOrgAuth } from "@/lib/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface UserSettings {
  name: string;
  email: string;
}

export interface OrganizationSettings {
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  logoUrl: string | null;
  invoicePrefix: string | null;
  invoiceNextNumber: number | null;
}

export async function getUserSettings(): Promise<UserSettings | null> {
  const session = await requireAuth();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
  };
}

export async function getSettings(): Promise<OrganizationSettings | null> {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) return null;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, activeOrganization.id),
  });

  if (!org) return null;

  return {
    name: org.name,
    slug: org.slug,
    address: org.address,
    phone: org.phone,
    email: org.email,
    taxId: org.taxId,
    logoUrl: org.logo,
    invoicePrefix: org.invoicePrefix,
    invoiceNextNumber: org.invoiceNextNumber,
  };
}

export async function updateUserSettings(data: Partial<UserSettings>) {
  const session = await requireAuth();

  await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/settings");

  return { success: true };
}

export async function updateSettings(data: Partial<OrganizationSettings>) {
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return { success: false, error: "No active organization" };
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, activeOrganization.id),
  });

  if (!org) {
    return { success: false, error: "Organization not found" };
  }

  // Map fields
  const {
    name,
    slug,
    address,
    phone,
    email,
    taxId,
    logoUrl,
    invoicePrefix,
    invoiceNextNumber,
  } = data;

  await db
    .update(organizations)
    .set({
      ...(name && { name }),
      ...(slug && { slug }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(taxId !== undefined && { taxId }),
      ...(logoUrl !== undefined && { logo: logoUrl }),
      ...(invoicePrefix !== undefined && { invoicePrefix }),
      ...(invoiceNextNumber !== undefined && { invoiceNextNumber }),
    })
    .where(eq(organizations.id, activeOrganization.id));

  revalidatePath("/settings");
  revalidatePath("/invoices");
  revalidatePath("/invoices/new");

  return { success: true };
}
