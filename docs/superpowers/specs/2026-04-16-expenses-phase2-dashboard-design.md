# Expenses Phase 2 — Dashboard Integration Design

**Date:** 2026-04-16
**Status:** Approved (pre-implementation)
**Phase:** 2 of 3

## Goal

Add expense awareness to the existing dashboard: two new metric cards (Total Expenses, Net Profit with monthly subtitle) and a Recent Expenses table mirroring the existing Recent Invoices.

## Non-goals

- Charts or graphs (Phase 3 reports).
- Date-range picker or time-period selector on the dashboard.
- Expense-by-category breakdown.
- Any changes to the existing 5 invoice metric cards.
- New pages or routes — this is dashboard-only.

## New metric cards

### Card 6: Total Expenses

- **Value:** `SUM(expenses.amount)` across all expenses for the org (all-time).
- **Icon:** `Receipt` from lucide-react.
- **Color:** amber — `bg-chart-3/15` icon bg, `text-chart-3` icon color (matches the "pending" palette, visually distinct from the green revenue card).
- **Position:** after "Total Clients" (6th card).

### Card 7: Net Profit

- **Value:** `Total Revenue (invoices.amountPaid) − Total Expenses (expenses.amount)` (all-time).
- **Subtitle:** "This month: ±X ₪" showing `(this month revenue) − (this month expenses)`.
- **Icon:** `TrendingUp` when profit ≥ 0, `TrendingDown` when negative.
- **Color:** green (`text-chart-2`, `bg-chart-2/15`) when positive; red (`text-destructive`, `bg-destructive/10`) when negative.
- **Highlight:** card border highlights red when net profit is negative (same pattern as the "overdue" card).
- **Position:** 7th card (last).

### Grid layout

Current: `grid-cols-2 md:grid-cols-3 lg:grid-cols-5` (5 cards in one row on desktop).

New: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (7 cards wrap into 4+3 on desktop). This gives each card more horizontal space than a 7-column squeeze, and the second row of 3 cards aligns naturally under the first 3.

## Recent Expenses table

A new `RecentExpenses` component rendered below the existing `RecentInvoices` section.

**Data:** Last 5 expenses for the org, ordered by `expenses.date DESC`, with `category` relation loaded.

**Columns:** Date (formatted like "Apr 14"), Description (or "—"), Category (colored badge, translated if default), Amount (₪ format, right-aligned).

**Each row:** links to `/expenses/[id]`.

**Empty state:** "No expenses yet" with a link to `/expenses/new`.

**Footer:** "View All" link to `/expenses`.

**Pattern:** Identical to `components/dashboard/recent-invoices.tsx` — a Card with CardHeader (title + "View All" link) and CardContent (table on desktop, cards on mobile).

## Data queries

Extend the existing `Promise.all` in `app/(dashboard)/dashboard/page.tsx` with two more queries:

```ts
// Expense aggregates
db.select({
  totalExpenses: sql<string>`COALESCE(SUM(amount), 0)`,
  thisMonthExpenses: sql<string>`COALESCE(SUM(CASE WHEN date >= ${monthStart} THEN amount ELSE 0 END), 0)`,
}).from(expenses).where(eq(expenses.organizationId, organizationId)),

// This month revenue (for profit subtitle)
db.select({
  thisMonthRevenue: sql<string>`COALESCE(SUM(CASE WHEN created_at >= ${monthStart} THEN amount_paid ELSE 0 END), 0)`,
}).from(invoices).where(eq(invoices.organizationId, organizationId)),

// Recent 5 expenses
db.query.expenses.findMany({
  where: eq(expenses.organizationId, organizationId),
  with: { category: true },
  orderBy: [desc(expenses.date)],
  limit: 5,
}),
```

`monthStart` is computed once: `new Date(now.getFullYear(), now.getMonth(), 1)`.

The `metrics` object passed to `DashboardMetrics` gains three new fields:

```ts
totalExpenses: number;      // all-time
netProfit: number;          // totalRevenue - totalExpenses (all-time)
thisMonthProfit: number;    // thisMonthRevenue - thisMonthExpenses
```

## Component changes

### `components/dashboard/metrics.tsx`

- Add `totalExpenses`, `netProfit`, `thisMonthProfit` to `DashboardMetricsProps.metrics`.
- Add Card 6 (Total Expenses) and Card 7 (Net Profit) to the `cards` array.
- Card 7 has dynamic icon (`TrendingUp` / `TrendingDown`), dynamic color, highlight when negative, and a subtitle line.
- Change grid class from `lg:grid-cols-5` to `lg:grid-cols-4`.

### `components/dashboard/recent-expenses.tsx` (new)

- Props: `expenses` array (with category relation).
- Renders a Card with a table: Date, Description, Category badge, Amount.
- Category badge display: if `category.isDefault`, use `t("expenseCategories.<name>")`, otherwise raw name. Same color-hash badge pattern as the expenses list page.
- Empty state when no expenses.
- "View All" link in the header.

### `app/(dashboard)/dashboard/page.tsx`

- Import `expenses` from `@/db` and `RecentExpenses`.
- Add the three new queries to `Promise.all`.
- Compute `monthStart`, expense aggregates, profit numbers.
- Pass extended metrics to `DashboardMetrics`.
- Render `<RecentExpenses />` below `<RecentInvoices />`.

## Translations

New keys under `dashboard` in `messages/{en,ar}.json`:

| Key | English | Arabic |
|---|---|---|
| `totalExpenses` | Total Expenses | إجمالي المصروفات |
| `netProfit` | Net Profit | صافي الربح |
| `thisMonth` | This month | هذا الشهر |
| `recentExpenses` | Recent Expenses | المصروفات الأخيرة |
| `viewAllExpenses` | View All | عرض الكل |
| `noRecentExpenses` | No expenses yet | لا توجد مصروفات بعد |

## Touched files

| File | Action |
|---|---|
| `messages/en.json` | Add 6 keys under `dashboard` |
| `messages/ar.json` | Same 6 keys in Arabic |
| `app/(dashboard)/dashboard/page.tsx` | Extend queries, compute profit, render RecentExpenses |
| `components/dashboard/metrics.tsx` | Add 2 cards, change grid, add imports |
| `components/dashboard/recent-expenses.tsx` | New component |

## Success criteria

1. Dashboard shows 7 metric cards in a 4+3 grid on desktop.
2. "Total Expenses" shows the correct all-time sum.
3. "Net Profit" shows revenue − expenses. Subtitle shows this month's profit. Card turns red when negative.
4. Recent Expenses table shows the last 5 expenses with category badges and links to detail pages.
5. Empty state renders correctly when there are no expenses.
6. All labels are bilingual (Arabic + English).
7. Existing 5 metric cards and Recent Invoices table are completely unchanged.
