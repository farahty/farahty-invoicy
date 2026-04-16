"use server";

import { db } from "@/db";
import { expenseCategories, expenses } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { requireOrgAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const DEFAULT_CATEGORIES = [
  { name: "materials", sortOrder: 0 },
  { name: "rent", sortOrder: 1 },
  { name: "utilities", sortOrder: 2 },
  { name: "equipment", sortOrder: 3 },
  { name: "shipping", sortOrder: 4 },
  { name: "maintenance", sortOrder: 5 },
  { name: "supplies", sortOrder: 6 },
  { name: "other", sortOrder: 7 },
];

export async function seedDefaultCategories(organizationId: string) {
  const existing = await db.query.expenseCategories.findFirst({
    where: and(
      eq(expenseCategories.organizationId, organizationId),
      eq(expenseCategories.isDefault, true)
    ),
  });
  if (existing) return;

  await db.insert(expenseCategories).values(
    DEFAULT_CATEGORIES.map((cat) => ({
      organizationId,
      name: cat.name,
      isDefault: true,
      sortOrder: cat.sortOrder,
    }))
  );
}

export async function getExpenseCategories() {
  const { activeOrganization } = await requireOrgAuth();
  if (!activeOrganization) return [];

  return db.query.expenseCategories.findMany({
    where: eq(expenseCategories.organizationId, activeOrganization.id),
    orderBy: (cats, { asc }) => [asc(cats.sortOrder), asc(cats.createdAt)],
  });
}

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export async function createExpenseCategory(data: { name: string }) {
  const { activeOrganization } = await requireOrgAuth();
  if (!activeOrganization)
    return { success: false, error: "No active organization" };

  const validated = categorySchema.parse(data);

  const allCats = await db.query.expenseCategories.findMany({
    where: eq(expenseCategories.organizationId, activeOrganization.id),
  });
  const maxSort = allCats.reduce(
    (max, cat) => Math.max(max, cat.sortOrder),
    -1
  );

  const [category] = await db
    .insert(expenseCategories)
    .values({
      organizationId: activeOrganization.id,
      name: validated.name,
      isDefault: false,
      sortOrder: maxSort + 1,
    })
    .returning();

  revalidatePath("/settings");
  revalidatePath("/expenses");
  return { success: true, category };
}

export async function updateExpenseCategory(
  id: string,
  data: { name: string }
) {
  const { activeOrganization } = await requireOrgAuth();
  if (!activeOrganization)
    return { success: false, error: "No active organization" };

  const validated = categorySchema.parse(data);

  const existing = await db.query.expenseCategories.findFirst({
    where: and(
      eq(expenseCategories.id, id),
      eq(expenseCategories.organizationId, activeOrganization.id)
    ),
  });
  if (!existing)
    return { success: false, error: "Category not found" };

  await db
    .update(expenseCategories)
    .set({ name: validated.name })
    .where(eq(expenseCategories.id, id));

  revalidatePath("/settings");
  revalidatePath("/expenses");
  return { success: true };
}

export async function deleteExpenseCategory(id: string) {
  const { activeOrganization } = await requireOrgAuth();
  if (!activeOrganization)
    return { success: false, error: "No active organization" };

  const existing = await db.query.expenseCategories.findFirst({
    where: and(
      eq(expenseCategories.id, id),
      eq(expenseCategories.organizationId, activeOrganization.id)
    ),
  });
  if (!existing)
    return { success: false, error: "Category not found" };

  if (existing.isDefault)
    return { success: false, error: "categoryIsDefault" };

  const [usage] = await db
    .select({ count: count() })
    .from(expenses)
    .where(eq(expenses.categoryId, id));

  if (usage.count > 0)
    return { success: false, error: "categoryInUse" };

  await db
    .delete(expenseCategories)
    .where(eq(expenseCategories.id, id));

  revalidatePath("/settings");
  revalidatePath("/expenses");
  return { success: true };
}
