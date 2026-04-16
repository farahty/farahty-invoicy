# Expenses Module Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full CRUD for expenses and expense categories, with preset/user-managed categories, optional client linking, search/filter list page, activity logging, sidebar navigation, and bilingual (en/ar) support.

**Architecture:** Two new tables (`expense_categories`, `expenses`) following the existing multi-tenant pattern. Server actions in `actions/expenses.ts` + `actions/expense-categories.ts` mirror the client/invoice patterns. UI follows the exact component patterns from the client module (form, list, detail, edit). Default categories use i18n keys for bilingual display; user-created categories store freetext. Category management lives in the settings page as an inline editor.

**Tech Stack:** Next.js 16, Drizzle ORM, PostgreSQL (Neon), Zod, react-hook-form, next-intl, Tailwind, Shadcn UI, lucide-react.

**Reference spec:** [docs/superpowers/specs/2026-04-16-expenses-phase1-design.md](../specs/2026-04-16-expenses-phase1-design.md)

---

## File Structure

### New files

| File | Purpose |
|---|---|
| `db/migrations/0003_*.sql` | Schema migration for both tables |
| `actions/expenses.ts` | Expense CRUD: `getExpenses`, `getExpense`, `createExpense`, `updateExpense`, `deleteExpense` |
| `actions/expense-categories.ts` | Category CRUD: `getExpenseCategories`, `createExpenseCategory`, `updateExpenseCategory`, `deleteExpenseCategory`, `seedDefaultCategories` |
| `app/(dashboard)/expenses/page.tsx` | Expense list page |
| `app/(dashboard)/expenses/new/page.tsx` | Create expense page |
| `app/(dashboard)/expenses/[id]/page.tsx` | Expense detail page |
| `app/(dashboard)/expenses/[id]/edit/page.tsx` | Edit expense page |
| `components/expenses/expense-form.tsx` | Two-card form (React Hook Form + Zod) |
| `components/expenses/expense-search.tsx` | Search input with URL params |
| `components/expenses/expense-filters.tsx` | Category + payment method + date range filters |
| `components/expenses/expense-actions.tsx` | Row action dropdown (View, Edit, Delete) |
| `components/expenses/expense-category-manager.tsx` | Inline category editor for settings page |

### Modified files

| File | Change |
|---|---|
| `db/schema.ts` | Add `expense_categories` + `expenses` tables, relations, add `"expense"` to `activityEntityEnum` |
| `messages/en.json` | Add `expenses.*`, `expenseCategories.*`, `navigation.expenses`, `activity.entityTypes.expense` keys |
| `messages/ar.json` | Same keys in Arabic |
| `components/layout/sidebar.tsx` | Add Expenses nav item between Clients and Activity |
| `components/dashboard/quick-actions.tsx` | Add "New Expense" button |
| `components/activity/activity-log-list.tsx` | Add `expense: Receipt` to `entityIcons` |
| `app/(dashboard)/settings/page.tsx` | Add expense category manager section |
| `lib/auth.ts` | Add `organization.create.after` hook to seed default categories |

---

## Task 1: Schema + migration

**Files:**
- Modify: `db/schema.ts`
- Create: `db/migrations/0003_*.sql` (generated)

- [ ] **Step 1: Add `expense_categories` table to schema**

Open `db/schema.ts`. After the `activityLogs` table definition (near the end of the file, before the relations section), add:

```ts
// ============================================
// Expense Categories
// ============================================

export const expenseCategories = pgTable(
  "expense_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("expense_categories_organization_id_idx").on(table.organizationId),
  ]
);
```

Import `boolean` and `integer` from `drizzle-orm/pg-core` if not already imported. Check the existing imports at the top of the file — `boolean` is likely there from the auth tables; `integer` may need adding.

- [ ] **Step 2: Add `expenses` table to schema**

Immediately after `expenseCategories`, add:

```ts
// ============================================
// Expenses
// ============================================

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => expenseCategories.id),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    amount: decimal("amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    date: timestamp("date").notNull(),
    description: text("description"),
    paymentMethod: text("payment_method").$type<PaymentMethod>(),
    reference: text("reference"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("expenses_organization_id_idx").on(table.organizationId),
    index("expenses_category_id_idx").on(table.categoryId),
    index("expenses_client_id_idx").on(table.clientId),
    index("expenses_date_idx").on(table.date),
  ]
);
```

`PaymentMethod` is already exported from the schema (used by `payments` table). Verify it exists — look for `paymentMethodEnum`.

- [ ] **Step 3: Add `"expense"` to `activityEntityEnum`**

Find `activityEntityEnum` (around line 435). Add `"expense"` to the array:

```ts
export const activityEntityEnum = [
  "client",
  "invoice",
  "payment",
  "organization",
  "member",
  "expense",
] as const;
```

- [ ] **Step 4: Add relations**

Find the relations section of the schema (where `invoicesRelations`, `clientsRelations`, etc. are defined). Add:

```ts
export const expenseCategoriesRelations = relations(
  expenseCategories,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [expenseCategories.organizationId],
      references: [organizations.id],
    }),
    expenses: many(expenses),
  })
);

export const expensesRelations = relations(expenses, ({ one }) => ({
  organization: one(organizations, {
    fields: [expenses.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  client: one(clients, {
    fields: [expenses.clientId],
    references: [clients.id],
  }),
}));
```

Import `relations` from `drizzle-orm` if not already imported (it likely is).

- [ ] **Step 5: Export types**

Near the other type exports, add:

```ts
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
```

- [ ] **Step 6: Generate and apply migration**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

Verify the generated SQL creates both tables with the expected columns, NOT NULL constraints, defaults, foreign keys, and indexes. If `drizzle-kit push` prompts for confirmation, proceed (additive only).

- [ ] **Step 7: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add db/schema.ts db/migrations
git commit -m "feat(expenses): add expense_categories and expenses tables"
```

---

## Task 2: Translations

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ar.json`

- [ ] **Step 1: Add all English keys**

Open `messages/en.json`. Add these three top-level objects (alongside the existing `invoices`, `clients`, etc.):

Under `navigation`, add: `"expenses": "Expenses"`.

Add a new top-level `expenses` object:

```json
  "expenses": {
    "title": "Expenses",
    "newExpense": "New Expense",
    "editExpense": "Edit Expense",
    "deleteExpense": "Delete Expense",
    "deleteConfirm": "Are you sure you want to delete this expense?",
    "amount": "Amount",
    "date": "Date",
    "category": "Category",
    "description": "Description",
    "paymentMethod": "Payment Method",
    "reference": "Reference",
    "notes": "Notes",
    "client": "Client",
    "selectCategory": "Select category",
    "selectClient": "Select client (optional)",
    "selectPaymentMethod": "Select payment method",
    "expenseDetails": "Expense Details",
    "additionalInfo": "Additional Info",
    "created": "Expense created",
    "updated": "Expense updated",
    "deleted": "Expense deleted",
    "noExpenses": "No expenses yet",
    "noExpensesDescription": "Start tracking your business expenses",
    "noResults": "No expenses match your search",
    "searchPlaceholder": "Search expenses...",
    "totalFiltered": "Total",
    "thisMonth": "This Month",
    "count": "Count",
    "allCategories": "All Categories",
    "allMethods": "All Methods",
    "errors": {
      "amountRequired": "Amount is required",
      "amountPositive": "Amount must be greater than 0",
      "categoryRequired": "Please select a category",
      "dateRequired": "Date is required"
    }
  },
```

Add a new top-level `expenseCategories` object:

```json
  "expenseCategories": {
    "title": "Expense Categories",
    "description": "Manage categories for organizing expenses",
    "materials": "Materials",
    "rent": "Rent",
    "utilities": "Utilities",
    "equipment": "Equipment",
    "shipping": "Shipping",
    "maintenance": "Maintenance",
    "supplies": "Supplies",
    "other": "Other",
    "addCategory": "Add Category",
    "categoryName": "Category name",
    "categoryInUse": "Cannot delete — this category has expenses",
    "categoryIsDefault": "Default categories cannot be deleted",
    "unnamed": "Unnamed Category"
  },
```

Under `activity.entityTypes`, add: `"expense": "expense"`.

- [ ] **Step 2: Add all Arabic keys**

Open `messages/ar.json`. Mirror Step 1:

Under `navigation`, add: `"expenses": "المصروفات"`.

```json
  "expenses": {
    "title": "المصروفات",
    "newExpense": "مصروف جديد",
    "editExpense": "تعديل المصروف",
    "deleteExpense": "حذف المصروف",
    "deleteConfirm": "هل أنت متأكد من حذف هذا المصروف؟",
    "amount": "المبلغ",
    "date": "التاريخ",
    "category": "الفئة",
    "description": "الوصف",
    "paymentMethod": "طريقة الدفع",
    "reference": "المرجع",
    "notes": "ملاحظات",
    "client": "العميل",
    "selectCategory": "اختر الفئة",
    "selectClient": "اختر العميل (اختياري)",
    "selectPaymentMethod": "اختر طريقة الدفع",
    "expenseDetails": "تفاصيل المصروف",
    "additionalInfo": "معلومات إضافية",
    "created": "تم إنشاء المصروف",
    "updated": "تم تحديث المصروف",
    "deleted": "تم حذف المصروف",
    "noExpenses": "لا توجد مصروفات بعد",
    "noExpensesDescription": "ابدأ بتتبع مصروفات عملك",
    "noResults": "لا توجد مصروفات تطابق بحثك",
    "searchPlaceholder": "البحث في المصروفات...",
    "totalFiltered": "المجموع",
    "thisMonth": "هذا الشهر",
    "count": "العدد",
    "allCategories": "جميع الفئات",
    "allMethods": "جميع الطرق",
    "errors": {
      "amountRequired": "المبلغ مطلوب",
      "amountPositive": "المبلغ يجب أن يكون أكبر من صفر",
      "categoryRequired": "الرجاء اختيار فئة",
      "dateRequired": "التاريخ مطلوب"
    }
  },
```

```json
  "expenseCategories": {
    "title": "فئات المصروفات",
    "description": "إدارة فئات تنظيم المصروفات",
    "materials": "مواد",
    "rent": "إيجار",
    "utilities": "مرافق",
    "equipment": "معدات",
    "shipping": "شحن",
    "maintenance": "صيانة",
    "supplies": "مستلزمات",
    "other": "أخرى",
    "addCategory": "إضافة فئة",
    "categoryName": "اسم الفئة",
    "categoryInUse": "لا يمكن الحذف — هذه الفئة تحتوي على مصروفات",
    "categoryIsDefault": "لا يمكن حذف الفئات الافتراضية",
    "unnamed": "فئة بدون اسم"
  },
```

Under `activity.entityTypes`, add: `"expense": "مصروف"`.

- [ ] **Step 3: Verify JSON + typecheck**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('messages/ar.json','utf8'))"
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/ar.json
git commit -m "feat(expenses): add all expense and category translation strings"
```

---

## Task 3: Category server actions + seed + onboarding hook

**Files:**
- Create: `actions/expense-categories.ts`
- Modify: `lib/auth.ts`

- [ ] **Step 1: Create `actions/expense-categories.ts`**

Create the file with the full CRUD + seed function. Follow the pattern of `actions/clients.ts`: `"use server"` directive, Zod validation, `requireOrgAuth()`, activity logging, `revalidatePath`.

```ts
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
  if (existing) return; // Already seeded

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

  // Get next sort order
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

  // Check if any expenses use this category
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
```

- [ ] **Step 2: Hook into onboarding**

Open `lib/auth.ts`. Find the `databaseHooks` section inside the Better Auth config. Add an `organization.create.after` hook that calls `seedDefaultCategories`.

First, add the import at the top of the file:

```ts
import { seedDefaultCategories } from "@/actions/expense-categories";
```

Then inside the `databaseHooks` object, add (you may need to read the current structure to find the exact insertion point — look for `databaseHooks: {`):

```ts
organization: {
  create: {
    after: async (org) => {
      try {
        await seedDefaultCategories(org.id);
      } catch (error) {
        console.error("Failed to seed expense categories:", error);
      }
    },
  },
},
```

If `databaseHooks` doesn't already have an `organization` key, add it. If it does, merge.

- [ ] **Step 3: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add actions/expense-categories.ts lib/auth.ts
git commit -m "feat(expenses): add category CRUD actions and onboarding seed"
```

---

## Task 4: Expense CRUD server actions

**Files:**
- Create: `actions/expenses.ts`

- [ ] **Step 1: Create `actions/expenses.ts`**

Follow `actions/clients.ts` pattern. Full file:

```ts
"use server";

import { db } from "@/db";
import {
  expenses,
  expenseCategories,
  clients,
  paymentMethodEnum,
} from "@/db/schema";
import { eq, and, desc, ilike, gte, lte, sql, count } from "drizzle-orm";
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

  // Compute aggregates
  const filteredTotal = results.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0
  );

  // This month total (from all expenses, not just filtered)
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

  // Verify category belongs to this org
  const category = await db.query.expenseCategories.findFirst({
    where: and(
      eq(expenseCategories.id, validated.categoryId),
      eq(expenseCategories.organizationId, activeOrganization.id)
    ),
  });
  if (!category)
    return { success: false, error: "Category not found" };

  // Verify client if provided
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

  // Verify category
  const category = await db.query.expenseCategories.findFirst({
    where: and(
      eq(expenseCategories.id, validated.categoryId),
      eq(expenseCategories.organizationId, activeOrganization.id)
    ),
  });
  if (!category)
    return { success: false, error: "Category not found" };

  // Verify client if provided
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
```

- [ ] **Step 2: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add actions/expenses.ts
git commit -m "feat(expenses): add expense CRUD server actions"
```

---

## Task 5: Navigation + activity log icon

**Files:**
- Modify: `components/layout/sidebar.tsx`
- Modify: `components/dashboard/quick-actions.tsx`
- Modify: `components/activity/activity-log-list.tsx`

- [ ] **Step 1: Add Expenses to sidebar**

Open `components/layout/sidebar.tsx`. Add `Receipt` to the lucide-react import. Find the `mainNavigation` array (around line 206). Insert between Clients and Activity:

```ts
const mainNavigation: NavItem[] = [
  { name: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
  { name: t("nav.invoices"), href: "/invoices", icon: FileText },
  { name: t("nav.clients"), href: "/clients", icon: Users },
  { name: t("nav.expenses"), href: "/expenses", icon: Receipt },
  { name: t("nav.activity"), href: "/activity", icon: History },
];
```

Also check for a `mobileNavigation` or bottom-tab array — if it exists, add Expenses there too in the same position.

- [ ] **Step 2: Add "New Expense" to quick actions**

Open `components/dashboard/quick-actions.tsx`. Add `Receipt` to the lucide-react import. After the existing "New Client" button, add:

```tsx
<Link href="/expenses/new">
  <Button variant="outline" className="gap-2">
    <Receipt className="h-4 w-4" />
    <span>{t("expenses.newExpense")}</span>
  </Button>
</Link>
```

Verify the translations hook: if the component uses `useTranslations("dashboard")`, the key path may need adjusting. If it uses a broader scope or multiple `useTranslations` calls, follow the existing pattern.

- [ ] **Step 3: Add expense icon to activity log**

Open `components/activity/activity-log-list.tsx`. Add `Receipt` to the lucide-react import. In `entityIcons` (around line 49), add:

```ts
expense: Receipt,
```

- [ ] **Step 4: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add components/layout/sidebar.tsx components/dashboard/quick-actions.tsx components/activity/activity-log-list.tsx
git commit -m "feat(expenses): add sidebar nav, quick action, and activity icon"
```

---

## Task 6: Category manager in settings

**Files:**
- Create: `components/expenses/expense-category-manager.tsx`
- Modify: `app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Create the category manager component**

Create `components/expenses/expense-category-manager.tsx`. This is a client component with an inline list that supports add, rename (click-to-edit), and delete. Follow the existing Shadcn UI + server action pattern.

The component should:
- Receive `categories` as a prop (fetched by the server component in settings page).
- Receive the current locale so it can decide: if `isDefault === true`, display `t("expenseCategories." + name)` instead of the raw name.
- Each row: category name (editable inline on click), and a delete button (disabled + lock icon for defaults).
- Delete calls `deleteExpenseCategory(id)`, shows `toast.error(t("expenseCategories.categoryInUse"))` or `t("expenseCategories.categoryIsDefault")` on failure.
- "Add Category" row at the bottom: text input + submit button, calls `createExpenseCategory({ name })`.
- Rename: on blur or Enter, calls `updateExpenseCategory(id, { name })`.

Use the pattern from existing settings components (e.g., `organization-settings-form.tsx`) for UI consistency — Card is provided by the parent, this component just renders the list content.

Build this as a complete `"use client"` component with `useTranslations("expenseCategories")`, `useState` for editing state, `useRouter` for refresh after mutations, and `toast` for feedback.

- [ ] **Step 2: Add the section to the settings page**

Open `app/(dashboard)/settings/page.tsx`. Import the component:

```ts
import { ExpenseCategoryManager } from "@/components/expenses/expense-category-manager";
import { getExpenseCategories } from "@/actions/expense-categories";
```

In the server component body, fetch categories:

```ts
const categories = await getExpenseCategories();
```

Add a new Card section after the Members section (around line 98) and before Invitations:

```tsx
        <Card>
          <CardHeader>
            <CardTitle>{tSettings("categories.title")}</CardTitle>
            <CardDescription>
              {tSettings("categories.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseCategoryManager categories={categories} />
          </CardContent>
        </Card>
```

Note: the settings page translations may use a different key namespace. Check whether it uses `useTranslations("settings")` or `getTranslations("settings")`. If the key namespace doesn't have `categories.title`, use `expenseCategories.title` and `expenseCategories.description` from the translations added in Task 2. Adjust the `t()` call accordingly (may need a second `getTranslations("expenseCategories")` call).

- [ ] **Step 3: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 4: Manual smoke test**

Start `npm run dev`, go to `/settings`. The new "Expense Categories" section should show the 8 defaults (in the user's locale). Add a custom category — it appears at the bottom. Try deleting a default (should show lock/error). Try renaming one.

- [ ] **Step 5: Commit**

```bash
git add components/expenses/expense-category-manager.tsx 'app/(dashboard)/settings/page.tsx'
git commit -m "feat(expenses): add category manager to settings page"
```

---

## Task 7: Expense form component

**Files:**
- Create: `components/expenses/expense-form.tsx`

- [ ] **Step 1: Create the two-card expense form**

Create `components/expenses/expense-form.tsx`. Follow the exact pattern of `components/clients/client-form.tsx` but with:

- **Zod schema:** `amount` (number, positive), `date` (string, required), `categoryId` (uuid, required), `description` (optional string), `paymentMethod` (optional enum), `clientId` (optional uuid), `reference` (optional string), `notes` (optional string).
- **Props:** `expense?` (for edit mode), `categories` (list of categories from server), `clients` (list of clients from server).
- **Two cards:** Card 1 "Expense Details" has: amount (number input with ₪ suffix), date (date input), category (Select dropdown), payment method (Select dropdown, optional), description (text input). Card 2 "Additional Info" has: client (Select dropdown, optional), reference (text input), notes (textarea).
- **Category display:** For each category in the Select, if `category.isDefault`, display `tCat(category.name)` (translated). Otherwise display `category.name` as-is.
- **onSubmit:** calls `createExpense(data)` or `updateExpense(expense.id, data)`. On success: `toast.success(t("created"/"updated"))`, `router.push("/expenses")` (or `/expenses/${expense.id}` on edit).
- **Default values for new:** `date: format(new Date(), "yyyy-MM-dd")`, `amount: 0`, rest empty.
- **Default values for edit:** populate from `expense` prop.

Use the same UI components: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Input`, `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `Textarea`, `Button`, `Separator`.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/expenses/expense-form.tsx
git commit -m "feat(expenses): add expense form component"
```

---

## Task 8: Expense list page + search + filters

**Files:**
- Create: `components/expenses/expense-search.tsx`
- Create: `components/expenses/expense-filters.tsx`
- Create: `components/expenses/expense-actions.tsx`
- Create: `app/(dashboard)/expenses/page.tsx`

- [ ] **Step 1: Create expense search component**

Create `components/expenses/expense-search.tsx`. Copy the exact pattern from `components/invoices/invoice-search.tsx` — debounced input with `URLSearchParams`, pushing to `/expenses?search=...`. Change the translation namespace to `expenses` and the placeholder key to `searchPlaceholder`.

- [ ] **Step 2: Create expense filters component**

Create `components/expenses/expense-filters.tsx`. A `"use client"` component that renders:
- Category dropdown: `Select` with "All Categories" default + categories passed as prop. If `isDefault`, display translated name.
- Payment method dropdown: `Select` with "All Methods" default + the existing payment method enum values.
- Date range: two date inputs (from/to).

Each filter updates `URLSearchParams` and pushes to `/expenses?categoryId=...&paymentMethod=...&dateFrom=...&dateTo=...`. Follow the `invoice-status-filter.tsx` pattern exactly.

Props: `categories` (from server), `currentCategoryId?`, `currentPaymentMethod?`, `currentDateFrom?`, `currentDateTo?`.

- [ ] **Step 3: Create expense actions dropdown**

Create `components/expenses/expense-actions.tsx`. Copy the pattern from `components/clients/client-actions.tsx`: a dropdown menu with View, Edit, Delete options. Delete shows a confirmation dialog, calls `deleteExpense(id)`, shows toast on result.

- [ ] **Step 4: Create the list page**

Create `app/(dashboard)/expenses/page.tsx` as a server component. Follow `app/(dashboard)/clients/page.tsx` exactly:

- Params: `searchParams` with `search`, `categoryId`, `paymentMethod`, `dateFrom`, `dateTo`.
- Calls `getExpenses(filters)` and `getExpenseCategories()`.
- Renders: page header with title + "New Expense" link/button, search + filters bar, summary bar (Total / This Month / Count as three metric cards), table (desktop) with columns: Date, Description, Category (badge), Client (or dash), Amount, Actions. Mobile: card layout.
- Category badge: a small colored pill. Use a simple hash of the category name to pick from a fixed set of Tailwind color classes (like `bg-blue-100 text-blue-800`, `bg-yellow-100 text-yellow-800`, etc.).
- Empty state: icon + message + link to create, same pattern as clients page.
- Category name in the table: if `category.isDefault`, display `t("expenseCategories." + category.name)`, otherwise `category.name`.

- [ ] **Step 5: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 6: Manual smoke test**

Start `npm run dev`, go to `/expenses`. Should see empty state. Create an expense via `/expenses/new`. Return to list — the expense appears. Test filters. Verify summary bar updates.

- [ ] **Step 7: Commit**

```bash
git add components/expenses/expense-search.tsx components/expenses/expense-filters.tsx components/expenses/expense-actions.tsx 'app/(dashboard)/expenses/page.tsx'
git commit -m "feat(expenses): add expense list page with search, filters, and summary"
```

---

## Task 9: Create, detail, and edit pages

**Files:**
- Create: `app/(dashboard)/expenses/new/page.tsx`
- Create: `app/(dashboard)/expenses/[id]/page.tsx`
- Create: `app/(dashboard)/expenses/[id]/edit/page.tsx`

- [ ] **Step 1: Create the "new expense" page**

Create `app/(dashboard)/expenses/new/page.tsx`. Server component that fetches categories and clients, renders `ExpenseForm`:

```tsx
import { getExpenseCategories } from "@/actions/expense-categories";
import { getClients } from "@/actions/clients";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewExpensePage() {
  const categories = await getExpenseCategories();
  const clients = await getClients();
  const t = await getTranslations("expenses");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/expenses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {t("newExpense")}
        </h1>
      </div>
      <ExpenseForm categories={categories} clients={clients} />
    </div>
  );
}
```

- [ ] **Step 2: Create the expense detail page**

Create `app/(dashboard)/expenses/[id]/page.tsx`. Server component:

- Calls `getExpense(id)`. If not found, `notFound()`.
- Renders a Card with all fields displayed (read-only), formatted:
  - Amount: `formatCurrency(expense.amount)`
  - Date: `format(new Date(expense.date), "MMMM d, yyyy")`
  - Category: translated if default, otherwise raw name
  - Payment method: translated label from the payments translation keys
  - Client: name as a link to `/clients/${expense.client.id}`, or "—"
  - Description, Reference, Notes: rendered if present
- Action buttons: Edit (link to `/expenses/${id}/edit`), Delete (with confirmation dialog calling `deleteExpense`).
- Activity log: `<EntityActivity entityType="expense" entityId={id} />` (reuse the existing component).

Follow the pattern of `app/(dashboard)/invoices/[id]/page.tsx` for layout.

- [ ] **Step 3: Create the edit page**

Create `app/(dashboard)/expenses/[id]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getExpense } from "@/actions/expenses";
import { getExpenseCategories } from "@/actions/expense-categories";
import { getClients } from "@/actions/clients";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EditExpensePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExpensePage({
  params,
}: EditExpensePageProps) {
  const { id } = await params;
  const expense = await getExpense(id);
  const t = await getTranslations("expenses");

  if (!expense) {
    notFound();
  }

  const categories = await getExpenseCategories();
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/expenses/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {t("editExpense")}
        </h1>
      </div>
      <ExpenseForm
        expense={expense}
        categories={categories}
        clients={clients}
      />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 5: Manual smoke test**

1. `/expenses/new` → fill form → save → redirects to `/expenses` or `/expenses/[id]`.
2. Click the expense → detail page shows all fields + activity log.
3. Click Edit → form is pre-populated → change amount → save → detail reflects update.
4. Delete from detail page → redirects to list → expense gone.

- [ ] **Step 6: Commit**

```bash
git add 'app/(dashboard)/expenses/new/page.tsx' 'app/(dashboard)/expenses/[id]/page.tsx' 'app/(dashboard)/expenses/[id]/edit/page.tsx'
git commit -m "feat(expenses): add create, detail, and edit pages"
```

---

## Task 10: Seed existing orgs + final verification

**Files:**
- May modify: `actions/expense-categories.ts` (if script approach needed)

- [ ] **Step 1: Seed default categories for existing organizations**

Existing organizations don't have expense categories yet. Run a one-time seed via Neon MCP or a quick script. Use the `seedDefaultCategories` function:

```bash
# Option A: via a quick script
node -e "
const { db } = require('./db');
const { organizations } = require('./db/schema');
const { seedDefaultCategories } = require('./actions/expense-categories');

async function seed() {
  const orgs = await db.select({ id: organizations.id }).from(organizations);
  for (const org of orgs) {
    await seedDefaultCategories(org.id);
    console.log('Seeded:', org.id);
  }
  process.exit(0);
}
seed();
"
```

If this doesn't work due to ESM/`"use server"` issues, use Neon MCP to run the insert directly:

```sql
INSERT INTO expense_categories (id, organization_id, name, is_default, sort_order, created_at)
SELECT gen_random_uuid(), o.id, cat.name, true, cat.sort_order, NOW()
FROM organizations o
CROSS JOIN (VALUES
  ('materials', 0), ('rent', 1), ('utilities', 2), ('equipment', 3),
  ('shipping', 4), ('maintenance', 5), ('supplies', 6), ('other', 7)
) AS cat(name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec
  WHERE ec.organization_id = o.id AND ec.is_default = true
);
```

- [ ] **Step 2: Full typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

Both must succeed.

- [ ] **Step 3: End-to-end smoke test**

1. Sidebar shows "Expenses" between Clients and Activity.
2. Dashboard quick actions has "New Expense" button.
3. `/settings` shows "Expense Categories" section with 8 defaults.
4. Add a custom category → appears in list.
5. `/expenses` shows empty state → click "New Expense".
6. Fill form (amount, date, category, description). Save.
7. Expense appears in list with category badge.
8. Click expense → detail page with all info + activity log showing "created".
9. Edit → change amount → save → activity log shows "updated".
10. Delete → confirm → gone from list, activity shows "deleted".
11. Filters: select a category → list filters. Clear → all show.
12. Search by description text → matches show.
13. Summary bar reflects correct totals.
14. Switch to Arabic locale → all labels render in Arabic, default category names are translated.

- [ ] **Step 4: Commit any remaining fixes and push**

```bash
git push
```
