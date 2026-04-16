# Expenses Phase 2 — Dashboard Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Total Expenses + Net Profit metric cards and a Recent Expenses table to the existing dashboard, giving the shop owner a complete financial snapshot.

**Architecture:** Extend the existing dashboard page query with expense aggregates (total, this-month) and recent expenses. Pass new fields to an extended `DashboardMetrics` component. Add a new `RecentExpenses` component mirroring `RecentInvoices`. No new tables, routes, or server actions.

**Tech Stack:** Next.js 16, Drizzle ORM raw SQL aggregates, Shadcn UI Cards, lucide-react icons, next-intl.

**Reference spec:** [docs/superpowers/specs/2026-04-16-expenses-phase2-dashboard-design.md](../specs/2026-04-16-expenses-phase2-dashboard-design.md)

---

## File Structure

| File | Action | Purpose |
|---|---|---|
| `messages/en.json` | Modify | Add 6 keys under `dashboard` |
| `messages/ar.json` | Modify | Same 6 keys in Arabic |
| `app/(dashboard)/dashboard/page.tsx` | Modify | Extend queries, compute profit, render RecentExpenses |
| `components/dashboard/metrics.tsx` | Modify | Add 2 cards, change grid, dynamic profit styling |
| `components/dashboard/recent-expenses.tsx` | Create | Recent 5 expenses table with category badges |

---

## Task 1: Translations

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ar.json`

- [ ] **Step 1: Add English keys**

Open `messages/en.json`. Find the `dashboard` object. Add these 6 keys (after the existing keys like `viewAll`, `recentInvoices`):

```json
    "totalExpenses": "Total Expenses",
    "netProfit": "Net Profit",
    "thisMonth": "This month",
    "recentExpenses": "Recent Expenses",
    "viewAllExpenses": "View All",
    "noRecentExpenses": "No expenses yet"
```

- [ ] **Step 2: Add Arabic keys**

Open `messages/ar.json`. Same location under `dashboard`:

```json
    "totalExpenses": "إجمالي المصروفات",
    "netProfit": "صافي الربح",
    "thisMonth": "هذا الشهر",
    "recentExpenses": "المصروفات الأخيرة",
    "viewAllExpenses": "عرض الكل",
    "noRecentExpenses": "لا توجد مصروفات بعد"
```

- [ ] **Step 3: Verify + commit**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('messages/ar.json','utf8'))"
npx tsc --noEmit
git add messages/en.json messages/ar.json
git commit -m "feat(dashboard): add expense metric and recent-expenses translation keys"
```

---

## Task 2: Recent Expenses component

**Files:**
- Create: `components/dashboard/recent-expenses.tsx`

- [ ] **Step 1: Create the component**

Create `components/dashboard/recent-expenses.tsx`. This mirrors `components/dashboard/recent-invoices.tsx` exactly — same Card structure, same desktop table + mobile cards pattern, same "View All" link.

```tsx
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Receipt } from "lucide-react";
import { format } from "date-fns";
import type { Expense, ExpenseCategory } from "@/db/schema";
import { useTranslations, useLocale } from "next-intl";

interface RecentExpensesProps {
  expenses: (Expense & { category: ExpenseCategory })[];
}

const categoryColors = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
];

function getCategoryColor(name: string) {
  return categoryColors[name.length % categoryColors.length];
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  const t = useTranslations();
  const tCat = useTranslations("expenseCategories");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    const formatted = value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ₪`;
  };

  const getCategoryName = (category: ExpenseCategory) => {
    if (category.isDefault) {
      try {
        return tCat(category.name as Parameters<typeof tCat>[0]);
      } catch {
        return category.name;
      }
    }
    return category.name;
  };

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("dashboard.recentExpenses")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {t("dashboard.noRecentExpenses")}
            </p>
            <Link href="/expenses/new">
              <Button>{t("expenses.newExpense")}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {t("dashboard.recentExpenses")}
        </CardTitle>
        <Link href="/expenses">
          <Button variant="ghost" size="sm" className="gap-1">
            {t("dashboard.viewAllExpenses")}
            <ArrowIcon className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("expenses.date")}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("expenses.description")}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("expenses.category")}
                </th>
                <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t("expenses.amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-border/50 last:border-0 hover:bg-accent"
                >
                  <td className="py-3 px-4 text-muted-foreground">
                    {format(new Date(expense.date), "MMM d, yyyy")}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="font-medium text-foreground hover:text-muted-foreground"
                    >
                      {expense.description || "—"}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category.name)}`}
                    >
                      {getCategoryName(expense.category)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-end font-medium text-foreground">
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {expenses.map((expense) => (
            <Link
              key={expense.id}
              href={`/expenses/${expense.id}`}
              className="block"
            >
              <div className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {expense.description || "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category.name)}`}
                  >
                    {getCategoryName(expense.category)}
                  </span>
                </div>
                <div className="flex items-center justify-end text-sm">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/dashboard/recent-expenses.tsx
git commit -m "feat(dashboard): add RecentExpenses component"
```

---

## Task 3: Extend dashboard metrics component

**Files:**
- Modify: `components/dashboard/metrics.tsx`

- [ ] **Step 1: Extend the props interface and add new cards**

Open `components/dashboard/metrics.tsx`. Make these changes:

**a) Add imports:** Add `Receipt`, `TrendingUp`, `TrendingDown` to the lucide-react import (alongside existing `DollarSign`, `Clock`, etc.).

**b) Extend the interface:** Add three new fields to `DashboardMetricsProps.metrics`:

```ts
interface DashboardMetricsProps {
  metrics: {
    totalRevenue: number;
    pendingAmount: number;
    overdueCount: number;
    partialCount: number;
    totalInvoices: number;
    totalClients: number;
    totalExpenses: number;
    netProfit: number;
    thisMonthProfit: number;
  };
}
```

**c) Add Card 6 (Total Expenses):** Append to the `cards` array, after the `totalClients` card:

```ts
    {
      title: t("totalExpenses"),
      value: formatCurrency(metrics.totalExpenses),
      icon: Receipt,
      iconBg: "bg-chart-3/15",
      iconColor: "text-chart-3",
    },
```

**d) Add Card 7 (Net Profit):** Append to the `cards` array after Card 6. This card has dynamic icon, color, and highlight:

```ts
    {
      title: t("netProfit"),
      value: formatCurrency(metrics.netProfit),
      subtitle: `${t("thisMonth")}: ${metrics.thisMonthProfit >= 0 ? "" : "−"}${formatCurrency(Math.abs(metrics.thisMonthProfit))}`,
      icon: metrics.netProfit >= 0 ? TrendingUp : TrendingDown,
      iconBg: metrics.netProfit >= 0 ? "bg-chart-2/15" : "bg-destructive/10",
      iconColor: metrics.netProfit >= 0 ? "text-chart-2" : "text-destructive",
      highlight: metrics.netProfit < 0,
      highlightClass: "border-destructive/50 bg-destructive/5",
      textHighlight: "text-destructive",
    },
```

**e) Add `subtitle` support to the card type and rendering.** The `cards` array items need a new optional `subtitle?: string` field. In the rendering JSX, add a subtitle line below the value `<p>`:

Find:
```tsx
                <p
                  className={`text-lg md:text-2xl font-bold ${
                    card.highlight
                      ? card.textHighlight || "text-foreground"
                      : "text-foreground"
                  }`}
                >
                  {card.value}
                </p>
```

Add immediately after it:

```tsx
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {card.subtitle}
                  </p>
                )}
```

**f) Change the grid class:** Replace `lg:grid-cols-5` with `lg:grid-cols-4`:

```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/dashboard/metrics.tsx
git commit -m "feat(dashboard): add Total Expenses and Net Profit metric cards"
```

---

## Task 4: Extend dashboard page queries

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Add imports and extend queries**

Open `app/(dashboard)/dashboard/page.tsx`.

**a) Add `expenses` to the import from `@/db`:**

```ts
import { db, invoices, clients, expenses } from "@/db";
```

If `expenses` is not exported from `@/db/index.ts`, import directly:

```ts
import { expenses } from "@/db/schema";
```

Check `db/index.ts` to see what it re-exports. Add the import from the right location.

**b) Add `RecentExpenses` import:**

```ts
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
```

**c) Compute `monthStart` before the `Promise.all`:**

```ts
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
```

**d) Add 3 new queries to the existing `Promise.all` array** (after the `clientCount` query):

```ts
    // Expense aggregates
    db
      .select({
        totalExpenses: sql<string>`COALESCE(SUM(amount), 0)`,
        thisMonthExpenses: sql<string>`COALESCE(SUM(CASE WHEN date >= ${monthStart} THEN amount ELSE 0 END), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.organizationId, organizationId)),

    // This month revenue (for profit subtitle)
    db
      .select({
        thisMonthRevenue: sql<string>`COALESCE(SUM(CASE WHEN created_at >= ${monthStart} THEN amount_paid ELSE 0 END), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.organizationId, organizationId)),

    // Recent 5 expenses
    db.query.expenses.findMany({
      where: eq(expenses.organizationId, organizationId),
      with: { category: true },
      orderBy: [desc(expenses.date)],
      limit: 5,
    }),
```

**e) Destructure the new results from `Promise.all`.** The current destructure is:

```ts
const [metricsData, recentInvoicesData, clientCount] = await Promise.all([...]);
```

Extend to:

```ts
const [metricsData, recentInvoicesData, clientCount, expenseAggregates, thisMonthRevenueData, recentExpensesData] = await Promise.all([...]);
```

**f) Compute new metric values and extend the `metrics` object:**

After the existing `const metrics = { ... }`, add:

```ts
  const totalExpenses = parseFloat(expenseAggregates[0]?.totalExpenses || "0");
  const thisMonthExpenses = parseFloat(expenseAggregates[0]?.thisMonthExpenses || "0");
  const thisMonthRevenue = parseFloat(thisMonthRevenueData[0]?.thisMonthRevenue || "0");
```

Then extend the `metrics` object to include:

```ts
  const metrics = {
    totalRevenue: parseFloat(metricsData[0]?.totalRevenue || "0"),
    pendingAmount: parseFloat(metricsData[0]?.pendingAmount || "0"),
    overdueCount: metricsData[0]?.overdueCount || 0,
    partialCount: metricsData[0]?.partialCount || 0,
    totalInvoices: metricsData[0]?.totalInvoices || 0,
    totalClients: clientCount[0]?.count || 0,
    totalExpenses,
    netProfit: parseFloat(metricsData[0]?.totalRevenue || "0") - totalExpenses,
    thisMonthProfit: thisMonthRevenue - thisMonthExpenses,
  };
```

**g) Render `RecentExpenses` below `RecentInvoices`:**

Add after `<RecentInvoices invoices={recentInvoicesData} />`:

```tsx
      {/* Recent Expenses */}
      <RecentExpenses expenses={recentExpensesData} />
```

- [ ] **Step 2: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add 'app/(dashboard)/dashboard/page.tsx'
git commit -m "feat(dashboard): integrate expense metrics and recent expenses"
```

---

## Task 5: Final verification

- [ ] **Step 1: Full build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 2: Manual smoke test**

Start `npm run dev`, go to `/dashboard`:

1. **7 metric cards** visible in a 4+3 grid on desktop.
2. **Total Expenses** shows the correct all-time sum (or 0 if no expenses).
3. **Net Profit** shows `Total Revenue − Total Expenses`. Subtitle shows "This month: ±X ₪". Card is green when positive, red when negative.
4. **Recent Expenses** table shows below Recent Invoices. If no expenses, shows empty state with "New Expense" button.
5. Create an expense at `/expenses/new`. Return to dashboard. The expense appears in Recent Expenses, and Total Expenses / Net Profit update.
6. **Arabic locale:** switch to Arabic. All 7 cards + both tables render correctly in RTL.
7. **Existing cards unchanged:** Total Revenue, Pending, Partial, Overdue, Clients show the same values as before.

- [ ] **Step 3: Push**

```bash
git push
```
