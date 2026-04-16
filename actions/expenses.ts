"use server";

import { db } from "@/db";
import {
  expenses,
  expenseCategories,
  clients,
  paymentMethodEnum,
} from "@/db/schema";
import { eq, and, desc, ilike, gte, lte, sql } from "drizzle-orm";
import { requireOrgAuth } from "@/lib/session";
import { logActivity } from "./activity";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.coerce.date(),
  categoryId: z.string().uuid("Please select a category"),
  clientId: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  paymentMethod: z.enum(paymentMethodEnum).nullable().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseInput = z.infer<typeof expenseSchema>;

export async function getExpenses(filters?: {
  search?: string;
  categoryId?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { activeOrganization } = await requireOrgAuth();
  if (!activeOrganization) return { expenses: [], total: 0, thisMonth: 0, count: 0 };

  const conditions = [eq(expenses.organizationId, activeOrganization.id)];

  if (filters?.search) {
    conditions.push(ilike(expenses.description, `%${filters.search}%`));
  }
  if (filters?.categoryId) {
    conditions.push(eq(expenses.categoryId, filters.categoryId));
  }
  if (filters?.paymentMethod) {
    conditions.push(
      eq(expenses.paymentMethod, filters.paymentMethod as typeof paymentMethodEnum[number])
    );
  }
  if (filters?.dateFrom) {
    conditions.push(gte(expenses.date, new Date(filters.dateFrom)));
  }
  if (filters?.dateTo) {
    conditions.push(lte(expenses.date, new Date(filters.dateTo)));
  }

  const results = await db.query.expenses.findMany({
    where: and(...conditions),
    with: {
      category: true,
      client: true,
    },
    orderBy: [desc(expenses.date), desc(expenses.createdAt)],
  });

  const filteredTotal = results.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [monthResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(expenses)
    .where(
      and(
        eq(expenses.organizationId, activeOrganization.id),
        gte(expenses.date, monthStart)
      )
    );

  return {
    expenses: results,
    total: filteredTotal,
    thisMonth: parseFloat(monthResult.total),
    count: results.length,
  };
}

export async function getExpense(id: string) {
  const { activeOrganization } = await requireOrgAuth();
  if (!activeOrganization) return null;

  return db.query.expenses.findFirst({
    where: and(
      eq(expenses.id, id),
      eq(expenses.organizationId, activeOrganization.id)
    ),
    with: {
      category: true,
      client: true,
      user: true,
    },
  });
}

export async function createExpense(data: ExpenseInput) {
  const { user, activeOrganization } = await requireOrgAuth();
  if (!activeOrganization)
    return { success: false, error: "No active organization" };

  const validated = expenseSchema.parse(data);

  const category = await db.query.expenseCategories.findFirst({
    where: and(
      eq(expenseCategories.id, validated.categoryId),
      eq(expenseCategories.organizationId, activeOrganization.id)
    ),
  });
  if (!category)
    return { success: false, error: "Category not found" };

  if (validated.clientId) {
    const client = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, validated.clientId),
        eq(clients.organizationId, activeOrganization.id)
      ),
    });
    if (!client)
      return { success: false, error: "Client not found" };
  }

  const [expense] = await db
    .insert(expenses)
    .values({
      organizationId: activeOrganization.id,
      userId: user.id,
      categoryId: validated.categoryId,
      clientId: validated.clientId || null,
      amount: validated.amount.toFixed(2),
      date: validated.date,
      description: validated.description,
      paymentMethod: validated.paymentMethod || null,
      reference: validated.reference,
      notes: validated.notes,
    })
    .returning();

  await logActivity({
    entityType: "expense",
    entityId: expense.id,
    entityName: validated.description || category.name,
    action: "created",
    newValues: {
      amount: validated.amount.toFixed(2),
      category: category.name,
      description: validated.description,
      clientId: validated.clientId,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true, expense };
}

export async function updateExpense(id: string, data: ExpenseInput) {
  const { activeOrganization } = await requireOrgAuth();
  if (!activeOrganization)
    return { success: false, error: "No active organization" };

  const validated = expenseSchema.parse(data);

  const existing = await db.query.expenses.findFirst({
    where: and(
      eq(expenses.id, id),
      eq(expenses.organizationId, activeOrganization.id)
    ),
    with: { category: true },
  });
  if (!existing)
    return { success: false, error: "Expense not found" };

  const category = await db.query.expenseCategories.findFirst({
    where: and(
      eq(expenseCategories.id, validated.categoryId),
      eq(expenseCategories.organizationId, activeOrganization.id)
    ),
  });
  if (!category)
    return { success: false, error: "Category not found" };

  if (validated.clientId) {
    const client = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, validated.clientId),
        eq(clients.organizationId, activeOrganization.id)
      ),
    });
    if (!client)
      return { success: false, error: "Client not found" };
  }

  const [expense] = await db
    .update(expenses)
    .set({
      categoryId: validated.categoryId,
      clientId: validated.clientId || null,
      amount: validated.amount.toFixed(2),
      date: validated.date,
      description: validated.description,
      paymentMethod: validated.paymentMethod || null,
      reference: validated.reference,
      notes: validated.notes,
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id))
    .returning();

  await logActivity({
    entityType: "expense",
    entityId: expense.id,
    entityName: validated.description || category.name,
    action: "updated",
    previousValues: {
      amount: existing.amount,
      category: existing.category?.name,
      description: existing.description,
    },
    newValues: {
      amount: validated.amount.toFixed(2),
      category: category.name,
      description: validated.description,
    },
    details: {
      amountChanged: existing.amount !== validated.amount.toFixed(2),
      categoryChanged: existing.categoryId !== validated.categoryId,
    },
  });

  revalidatePath("/expenses");
  revalidatePath(`/expenses/${id}`);
  revalidatePath("/dashboard");
  return { success: true, expense };
}

export async function deleteExpense(id: string) {
  const { activeOrganization } = await requireOrgAuth();
  if (!activeOrganization)
    return { success: false, error: "No active organization" };

  const existing = await db.query.expenses.findFirst({
    where: and(
      eq(expenses.id, id),
      eq(expenses.organizationId, activeOrganization.id)
    ),
    with: { category: true },
  });
  if (!existing)
    return { success: false, error: "Expense not found" };

  await db.delete(expenses).where(eq(expenses.id, id));

  await logActivity({
    entityType: "expense",
    entityId: id,
    entityName: existing.description || existing.category?.name || "Expense",
    action: "deleted",
    previousValues: {
      amount: existing.amount,
      category: existing.category?.name,
      description: existing.description,
      date: existing.date,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}
