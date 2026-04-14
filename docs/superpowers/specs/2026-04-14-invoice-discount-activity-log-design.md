# Invoice Discount — Activity Log Design

**Date:** 2026-04-14
**Status:** Approved (pre-implementation)

## Goal

When a user adds or changes an invoice's discount, the activity log must clearly show **who** made the change and **what** changed (type, raw value, and computed shekel amount). Reuses the existing `created` / `updated` activity actions — no enum growth, no DB migration.

## Non-goals

- A new `discount_changed` activity action.
- Backfilling existing activity-log rows with the new fields.
- Changes to the read-only invoice detail display, PDF, email, or form (they shipped in the previous feature).
- Reworking `deleteInvoice`'s logging.

## Data captured in the log entry

Extend the existing `logActivity({...})` calls inside `createInvoice`, `updateInvoice`, and `updateInvoiceWithPaymentRemovals`.

### On update (previous values)

```ts
previousValues: {
  total: existing.total,
  status: existing.status,
  itemCount: "unknown",          // pre-existing limitation, out of scope
  discount: {
    type: existing.discountType,         // "fixed" | "percent"
    value: existing.discountValue,       // stored string, e.g. "10.00"
    amount: previousDiscountAmount,      // computed number in ₪
  },
},
```

`previousDiscountAmount` is computed by a fresh call to `calculateInvoiceTotals` against the existing row's items, plus its stored `discountType` / `discountValue` / `taxRate`. The current `existing = db.query.invoices.findFirst({...})` lookup in `updateInvoice` does NOT load items — the implementation MUST add `with: { items: true }` so the previous items are available to `calculateInvoiceTotals`. Same for `updateInvoiceWithPaymentRemovals`, which already loads `payments` but not `items` — extend to `with: { items: true, payments: true }`.

### On update (new values)

```ts
newValues: {
  total: total.toFixed(2),
  status: newStatus,
  itemCount: validated.items.length,
  discount: {
    type: validated.discountType,
    value: validated.discountValue.toFixed(2),
    amount: discountAmount,              // from calculateInvoiceTotals
  },
},
```

### Details block

```ts
details: {
  totalChanged: existing.total !== total.toFixed(2),
  statusChanged: existing.status !== newStatus,
  discountChanged:
    existing.discountType !== validated.discountType ||
    parseFloat(existing.discountValue) !== validated.discountValue,
},
```

Always included, even when `false`.

### On create

`createInvoice` adds a `discount` block to its existing `newValues` object and a flag to `details`:

```ts
newValues: {
  invoiceNumber: invoice.invoiceNumber,
  clientId: validated.clientId,
  total: total.toFixed(2),
  itemCount: validated.items.length,
  discount: {
    type: validated.discountType,
    value: validated.discountValue.toFixed(2),
    amount: discountAmount,
  },
},
details: {
  clientName: client.name,
  subtotal: subtotal.toFixed(2),
  taxRate: validated.taxRate,
  taxAmount: taxAmount.toFixed(2),
  hasDiscount: discountAmount > 0,
},
```

There is no `previousValues.discount` on create (nothing to diff against).

## UI rendering

In `components/activity/activity-log-list.tsx`:

1. **On `action: "updated"` entries** where `details.discountChanged === true`:
   - Render a dedicated sentence-style line in addition to any generic update row.
   - If `previousValues.discount.amount === 0` (first-time discount), render *"{user} added a discount of {to}"*.
   - Otherwise render *"{user} changed discount from {from} to {to}"*.
   - `{from}` and `{to}` formatters: `formatCurrency(amount)` followed, when `type === "percent"`, by ` ({value}%)`; when `type === "fixed"`, just the currency string.

2. **On `action: "created"` entries** where `details.hasDiscount === true`:
   - Append a line *"Created with a discount of {to}"* to the standard creation entry.

3. **Localisation:** two new keys under `activity.discount` in `messages/{en,ar}.json`:
   - `activity.discount.changed` — "{user} changed discount from {from} to {to}" / "{user} غيّر الخصم من {from} إلى {to}"
   - `activity.discount.added` — "{user} added a discount of {to}" / "{user} أضاف خصماً بقيمة {to}"
   - `activity.discount.createdWith` — "Created with a discount of {to}" / "أُنشئت مع خصم بقيمة {to}"

4. Entries from before this change (missing `details.discountChanged` or missing `previousValues.discount`) render exactly as today — the new discount line is simply not emitted.

## Touched files

- `actions/invoices.ts` — extend three `logActivity(...)` call sites.
- `components/activity/activity-log-list.tsx` — render the discount sentence.
- `messages/en.json`, `messages/ar.json` — three new keys under `activity.discount`.

## Success criteria

1. Creating a new invoice with a non-zero discount produces an activity entry whose `newValues.discount` and `details.hasDiscount: true` are correctly populated, and the feed shows the "Created with a discount of …" line.
2. Editing an existing invoice to add, change, or remove the discount produces an entry whose `previousValues.discount` and `newValues.discount` both carry the right `{type, value, amount}`, and `details.discountChanged === true`. The feed shows the dedicated sentence.
3. Editing an existing invoice WITHOUT changing the discount still populates both `discount` blocks (unchanged before/after), `details.discountChanged === false`, and the feed does **not** emit the dedicated sentence.
4. Historic activity entries render unchanged.
5. The user name shown in the feed matches the acting user (existing `logActivity` joins `users` via `userId`; nothing to add).
6. No DB migration, no new enum value, no schema change.
