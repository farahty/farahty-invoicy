# Invoice-level Discount — Design

**Date:** 2026-04-14
**Status:** Approved (pre-implementation)

## Goal

Allow users to apply a single discount to an invoice's total (not per-item) while creating or updating an invoice. The discount can be a fixed shekel amount or a percentage of the subtotal and is applied before tax.

## Non-goals

- Per-item discounts.
- Stacking multiple discounts on one invoice.
- Coupon / promo codes.
- Dedicated discount reporting or dashboards.
- Changing the behaviour of any existing invoice in the database (migration writes zero-value defaults).

## Data model

Two new columns on the `invoices` table:

| Column | Type | Default | Notes |
|---|---|---|---|
| `discount_type` | `text` typed as `'fixed' \| 'percent'` | `'fixed'` | Stored via Drizzle's `.$type<DiscountType>()` pattern (same approach used for `status`). |
| `discount_value` | `text` (decimal) | `'0'` | Parsed as `number` in app code. Consistent with how `tax_rate`, `subtotal`, `total` are stored. |

A new Drizzle enum/const `discountTypeEnum = ['fixed', 'percent'] as const` is added next to `invoiceStatusEnum` in `db/schema.ts`. Type `DiscountType` is exported.

Generated Drizzle migration sets both columns `NOT NULL` with the defaults above so existing rows get `fixed / 0` automatically and no data backfill script is needed.

## Calculation

One canonical helper `calculateInvoiceTotals` lives in `actions/invoices.ts` and is the single source of truth used by `createInvoice`, `updateInvoice`, and `duplicateInvoice`.

```ts
function calculateInvoiceTotals(input: {
  items: { quantity: number; rate: number }[];
  taxRate: number;            // percent, e.g. 15
  discountType: DiscountType; // 'fixed' | 'percent'
  discountValue: number;      // shekels if fixed, percent if percent
}): {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}
```

Order of operations (subtotal → discount → tax → total):

```
subtotal           = Σ(item.quantity * item.rate)
discountAmount     = discountType === 'percent'
                        ? subtotal * (discountValue / 100)
                        : discountValue
discountedSubtotal = subtotal - discountAmount
taxAmount          = discountedSubtotal * (taxRate / 100)
total              = discountedSubtotal + taxAmount
balanceDue         = total - amountPaid  (unchanged — still computed at write time)
```

Rounding: each number is rounded to 2 decimals with `.toFixed(2)` before being stored, matching the existing convention.

## Validation

Enforced both in the Zod schema (`invoiceSchema`) and in the server action before DB writes. The form surfaces errors inline; the server returns `{ success: false, error: ... }` as with other validation failures.

| Rule | Message key |
|---|---|
| `discountValue >= 0` | `invoices.errors.discountNegative` |
| If `discountType === 'percent'`: `discountValue <= 100` | `invoices.errors.discountPercentOver100` |
| If `discountType === 'fixed'`: `discountValue <= subtotal` | `invoices.errors.discountExceedsSubtotal` |

The server validates a second time after computing `subtotal` to defend against a client that bypasses the form.

## Invoice form (UI)

File: `components/invoices/invoice-form.tsx`.

A new row is added to the totals summary, between **Subtotal** and **Tax**. The row always renders in the form (even when value is `0`) so the user can edit it.

Row layout:

- Label: `t("discount")`
- Type toggle: two-button toggle showing `₪` and `%` (same visual weight as existing action buttons). Bound to `discountType`.
- Value input: numeric input bound to `discountValue`, step `0.01`, min `0`.
- Computed preview on the right: `−{formatCurrency(discountAmount)}`, muted red. Recalculates whenever items, tax rate, or discount fields change (same `useWatch` pattern already used for `subtotal`/`total`).

Default values on new invoice: `discountType: 'fixed'`, `discountValue: 0`.
Default values when editing: from the loaded invoice.

## Read-only display

Rule: **hide the discount row when `discountAmount === 0`.** When shown, it appears between Subtotal and Tax and is styled muted/red to read as a credit.

Display string:

- `discountType === 'percent'`: `{t("discount")} ({discountValue}%)`
- `discountType === 'fixed'`: `{t("discount")}`

Amount string: `−{formatCurrency(discountAmount)}`.

Three files receive the same row:

1. Invoice detail page — `app/(dashboard)/invoices/[id]/page.tsx`, in the totals `<div>`.
2. HTML/PDF template — `components/invoices/invoice-html.tsx`, inside `.totals-box`.
3. Email template — `actions/invoices.ts` inside `sendInvoiceEmail`, same totals block.

Each rendering computes `discountAmount` from the stored `discountType`, `discountValue`, and `subtotal` via the shared helper (or an inline duplicate of the same formula — the helper is on the server, the detail page is a server component, so a single import suffices).

## Internationalisation

New keys added to both `messages/ar.json` and `messages/en.json` under `invoices`:

| Key | English | Arabic |
|---|---|---|
| `discount` | `Discount` | `الخصم` |
| `discountType.fixed` | `Amount (₪)` | `مبلغ (₪)` |
| `discountType.percent` | `Percentage (%)` | `نسبة (%)` |
| `errors.discountNegative` | `Discount must be 0 or greater` | `الخصم يجب أن يكون صفر أو أكثر` |
| `errors.discountPercentOver100` | `Discount percentage cannot exceed 100%` | `نسبة الخصم لا يمكن أن تتجاوز 100%` |
| `errors.discountExceedsSubtotal` | `Discount cannot exceed the subtotal` | `الخصم لا يمكن أن يتجاوز المجموع الفرعي` |

The hardcoded PDF dictionaries `englishTranslations` / `arabicTranslations` in `components/invoices/invoice-html.tsx` also gain a `discount` string, used only in the PDF.

## Migration strategy

- Drizzle migration adds the two columns with `DEFAULT 'fixed'` / `DEFAULT '0'` and `NOT NULL`.
- Existing invoices inherit those defaults on migration; no app-level backfill needed.
- No change to existing totals because `discount_value = 0` ⇒ `discountAmount = 0` ⇒ subtotal and total unchanged.
- `duplicateInvoice` copies `discountType` and `discountValue` from the original.

## Out-of-scope items (explicit)

- Per-item discount columns on `invoice_items`.
- Stacking multiple discounts.
- Coupon codes, promo codes.
- Discount analytics / reports.
- Changing calculations on any historical invoice.

## Touched files (preview)

- `db/schema.ts` — enum + columns
- `db/drizzle/` — new migration
- `actions/invoices.ts` — helper + create/update/duplicate/email send
- `components/invoices/invoice-form.tsx` — totals block, Zod schema, defaults
- `components/invoices/invoice-html.tsx` — PDF totals, translation strings
- `app/(dashboard)/invoices/[id]/page.tsx` — detail totals
- `messages/en.json`, `messages/ar.json` — new keys

## Success criteria

1. A new invoice saves with `discountType` and `discountValue` and the stored `total` reflects the discount.
2. Editing an existing invoice's discount updates `total` and `balanceDue` consistently; payments already recorded keep working.
3. Setting discount back to `0` hides the row in detail, PDF, and email.
4. Submitting a discount greater than the subtotal (fixed) or > 100 (percent) blocks save with the localised error.
5. `duplicateInvoice` preserves both discount fields.
6. Every historical invoice renders unchanged after the migration.
