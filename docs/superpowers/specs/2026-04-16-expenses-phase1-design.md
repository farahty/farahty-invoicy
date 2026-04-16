# Expenses Module — Phase 1 Design

**Date:** 2026-04-16
**Status:** Approved (pre-implementation)
**Phase:** 1 of 3 (Core CRUD + categories + navigation)

## Goal

Allow users to record, browse, edit, and delete business expenses (materials, rent, utilities, equipment, etc.) with flexible categorisation and optional client linking. This is the foundational module — dashboard integration and reporting come in Phase 2.

## Non-goals (Phase 1)

- Dashboard metrics (revenue vs expenses, profit summary).
- Profit/loss reports or expense analytics.
- Recurring/scheduled expenses.
- Receipt or image uploads.
- Vendor/supplier entity.
- Bulk import/export.
- Expense PDF/print or email notifications.
- Approval workflow or status lifecycle — expenses are simple ledger entries.

## Decisions

| Question | Decision |
|---|---|
| Expense scope | Materials + operational costs (rent, utilities, equipment, maintenance, shipping) |
| Client link | Optional — an expense CAN be linked to a client, most won't be |
| Categories | Presets + user-managed — ship defaults, users add/rename/delete |
| Category i18n | Default categories use translation keys in `messages/{en,ar}.json`; user-created categories store freetext |
| Fields per expense | Amount, date, category, description, payment method, optional client, optional reference, notes |
| Status workflow | None — create, edit, delete. No draft/approved/etc. |
| Form layout | Two-card (like invoice form): "Expense Details" card + "Additional Info" card |
| List page | Search + category/payment-method/date-range filters + summary bar (total, this month, count) + table |

## Data model

### `expense_categories` table

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | defaultRandom | PK |
| `organizationId` | text | — | FK → organizations, NOT NULL |
| `name` | text | — | NOT NULL. For defaults: a translation key like `materials`. For user-created: freetext in whatever language they typed. |
| `isDefault` | boolean | `false` | `true` for the 8 preset categories seeded on org creation |
| `sortOrder` | integer | `0` | Controls display order in dropdowns and settings |
| `createdAt` | timestamp | defaultNow | — |

Indexes: `organizationId`.

Relations: one organization, many expenses.

### `expenses` table

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | defaultRandom | PK |
| `organizationId` | text | — | FK → organizations, NOT NULL |
| `userId` | text | — | FK → users (who logged it), NOT NULL |
| `categoryId` | uuid | — | FK → expense_categories, NOT NULL |
| `clientId` | uuid | nullable | FK → clients, optional link |
| `amount` | decimal(12,2) | `'0'` | NOT NULL |
| `date` | timestamp | — | NOT NULL, when the expense occurred |
| `description` | text | nullable | Freetext |
| `paymentMethod` | text typed as `PaymentMethod` | nullable | Reuses existing enum: cash, card, bank_transfer, check, other |
| `reference` | text | nullable | Receipt number, check number, etc. |
| `notes` | text | nullable | Additional details |
| `createdAt` | timestamp | defaultNow | — |
| `updatedAt` | timestamp | defaultNow | — |

Indexes: `organizationId`, `categoryId`, `clientId`, `date`.

Relations: one organization, one user, one category, optional client.

### Default categories

Seeded when a new organization is created (via the existing onboarding flow or a migration for existing orgs). Eight presets:

| Key (stored in `name`) | English display | Arabic display |
|---|---|---|
| `materials` | Materials | مواد |
| `rent` | Rent | إيجار |
| `utilities` | Utilities | مرافق |
| `equipment` | Equipment | معدات |
| `shipping` | Shipping | شحن |
| `maintenance` | Maintenance | صيانة |
| `supplies` | Supplies | مستلزمات |
| `other` | Other | أخرى |

Translation keys live at `expenseCategories.<key>` in `messages/{en,ar}.json`. The UI checks: if `isDefault === true`, render `t("expenseCategories." + name)`; otherwise render `name` as-is.

### Schema enum additions

- Add `"expense"` to `activityEntityEnum` in `db/schema.ts` so activity logging works.
- No new action enum values — reuse `created`, `updated`, `deleted`.

## Pages and navigation

### Sidebar

Add to `mainNavigation` in `components/layout/sidebar.tsx`, between Invoices and Clients:

```ts
{ name: "Expenses", href: "/expenses", icon: Receipt }
```

Translated via `navigation.expenses` key in both locales.

### Routes

| Route | Type | Description |
|---|---|---|
| `/expenses` | Server component | List with search, category filter, payment method filter, date range filter. Summary bar shows filtered total, this-month total, and count. Table with date/description/category badge/client/amount/actions. Mobile: card layout. |
| `/expenses/new` | Server component wrapping `ExpenseForm` | Create form. Two-card layout: "Expense Details" (amount, date, category, payment method, description) + "Additional Info" (client, reference, notes). |
| `/expenses/[id]` | Server component | Detail view showing all fields + activity log (via existing `EntityActivity` component). |
| `/expenses/[id]/edit` | Server component wrapping `ExpenseForm` | Edit form, pre-populated from the existing expense. |

### Category management

A new section at the bottom of the existing `/settings` page:

- Heading: "Expense Categories" / "فئات المصروفات"
- List of categories, each showing name + sortOrder handle + delete button.
- Default categories (isDefault=true): can be renamed but not deleted. Show a lock icon.
- User categories: can be renamed and deleted. Delete is blocked if any expenses reference the category (with a toast error).
- "Add Category" input + button at the bottom.
- Changes are instant (server action per operation, no bulk save).

### Quick actions

Add "New Expense" button to the dashboard quick-actions component alongside existing "New Invoice" and "New Client".

## Server actions

File: `actions/expenses.ts` (new file, following the exact pattern of `actions/clients.ts`).

### `getExpenses(filters?)`

Filters: `search` (matches description), `categoryId`, `paymentMethod`, `dateFrom`, `dateTo`. Returns expenses with category and client relations loaded. Also returns aggregate totals for the summary bar (filtered total, this-month total, count).

### `getExpense(id)`

Returns a single expense with category and client relations.

### `createExpense(data)`

Zod validation → insert → activity log (`action: "created"`) → revalidate paths → return `{ success, expense }`.

### `updateExpense(id, data)`

Zod validation → verify ownership → update → activity log (`action: "updated"`, with `previousValues`/`newValues` including amount, category, description changes) → revalidate → return `{ success, expense }`.

### `deleteExpense(id)`

Verify ownership → hard delete → activity log (`action: "deleted"`) → revalidate → return `{ success }`.

File: `actions/expense-categories.ts` (new file).

### `getExpenseCategories()`

Returns all categories for the active org, ordered by `sortOrder`.

### `createExpenseCategory(data)`

Zod validation (name required, non-empty) → insert with `isDefault: false` → revalidate.

### `updateExpenseCategory(id, data)`

Verify ownership → update name/sortOrder → revalidate.

### `deleteExpenseCategory(id)`

Verify ownership → check no expenses reference it (if any, return error) → verify `isDefault === false` → delete → revalidate.

### `seedDefaultCategories(organizationId)`

Called from the onboarding flow when a new org is created. Inserts the 8 default categories with `isDefault: true`. Also called from a one-time migration for existing orgs that don't have categories yet.

## Components

| File | Purpose |
|---|---|
| `components/expenses/expense-form.tsx` | Two-card form (React Hook Form + Zod). Category select dropdown, client select (optional), payment method select, date picker, amount input, description, reference, notes. |
| `components/expenses/expense-search.tsx` | Search input with URL params, like `invoice-search.tsx`. |
| `components/expenses/expense-filters.tsx` | Category dropdown + payment method dropdown + date range pickers, all using URL params. |
| `components/expenses/expense-actions.tsx` | Row action dropdown: View, Edit, Delete (with confirmation dialog). |
| `components/expenses/expense-category-manager.tsx` | Inline list for the settings page — add/rename/delete categories. |

## Internationalisation

New keys in `messages/{en,ar}.json`:

**Top-level `expenses` object** (mirrors the `invoices` structure):
- `title`, `newExpense`, `editExpense`, `deleteExpense`, `deleteConfirm`
- `amount`, `date`, `category`, `description`, `paymentMethod`, `reference`, `notes`, `client`
- `expenseDetails`, `additionalInfo`
- `created`, `updated`, `deleted`
- `noExpenses`, `searchPlaceholder`
- `totalFiltered`, `thisMonth`, `count`
- Error keys: `amountRequired`, `categoryRequired`, `dateRequired`, `categoryInUse`, `categoryIsDefault`

**`expenseCategories` object** (the 8 default names):
- `materials`, `rent`, `utilities`, `equipment`, `shipping`, `maintenance`, `supplies`, `other`

**`navigation.expenses`** — sidebar label.

**`activity.entityTypes.expense`** — for the activity log.

## Activity logging

Reuses the existing `logActivity` infrastructure:

- `entityType: "expense"` (new enum value).
- `action: "created"` / `"updated"` / `"deleted"` (existing values).
- On create: `newValues` carries amount, category, description, client (if linked).
- On update: `previousValues` + `newValues` capture amount, category, description changes. `details.amountChanged`, `details.categoryChanged` booleans for the activity feed.
- On delete: `previousValues` carries the deleted expense's data for audit.

The activity feed in `components/activity/activity-log-list.tsx` needs a new icon mapping for `expense` entity type (use `Receipt` from lucide-react) and basic rendering for the three actions.

## Touched files (preview)

### New files
- `db/migrations/0003_*.sql` — new tables + indexes
- `actions/expenses.ts` — expense CRUD
- `actions/expense-categories.ts` — category CRUD + seed
- `app/(dashboard)/expenses/page.tsx` — list
- `app/(dashboard)/expenses/new/page.tsx` — create
- `app/(dashboard)/expenses/[id]/page.tsx` — detail
- `app/(dashboard)/expenses/[id]/edit/page.tsx` — edit
- `components/expenses/expense-form.tsx`
- `components/expenses/expense-search.tsx`
- `components/expenses/expense-filters.tsx`
- `components/expenses/expense-actions.tsx`
- `components/expenses/expense-category-manager.tsx`

### Modified files
- `db/schema.ts` — two new tables, relations, enum addition
- `components/layout/sidebar.tsx` — add Expenses nav item
- `components/dashboard/quick-actions.tsx` — add New Expense button
- `components/activity/activity-log-list.tsx` — expense icon + rendering
- `app/(dashboard)/settings/page.tsx` — add category manager section
- `messages/en.json`, `messages/ar.json` — all new keys

### Migration for existing orgs
- Seed default categories for each existing organization (run once via the migration or a script).

## Success criteria

1. A user can create an expense with all fields, see it in the list, open its detail, edit it, and delete it.
2. The category dropdown shows the 8 defaults (in the user's locale) plus any user-created categories.
3. A user can add, rename, and delete custom categories in Settings. Deleting a category with expenses shows an error. Default categories can be renamed but not deleted.
4. The list page filters by search/category/payment-method/date-range and the summary bar updates to match.
5. Linking an expense to a client is optional; the client column shows the name when linked, a dash otherwise.
6. Activity log shows expense create/update/delete events correctly.
7. The sidebar shows "Expenses" between "Invoices" and "Clients" with the Receipt icon.
8. All UI labels render in Arabic and English.
9. Existing features (invoices, clients, payments, dashboard) are completely untouched.
