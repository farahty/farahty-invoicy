# Invoice Discount Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an invoice-level discount (fixed amount or percentage of subtotal, applied before tax) that can be set while creating or editing an invoice, persisted in the DB, and displayed in the invoice detail page and PDF.

**Architecture:** Two new columns on `invoices` (`discount_type`, `discount_value`). A single shared helper `calculateInvoiceTotals` in `actions/invoices.ts` is the source of truth for `subtotal → discountAmount → taxAmount → total`, used by create/update/duplicate. The form gets one extra inline row between Subtotal and Tax with a type toggle and value input. Read-only views (detail page, PDF) add a discount row that is hidden when the computed amount is zero. Existing invoices default to `'fixed' / 0` on migration, so their rendered totals are unchanged.

**Tech Stack:** Next.js 16, Drizzle ORM, PostgreSQL (Neon), Zod, react-hook-form, next-intl, Tailwind. No automated test framework is in the project — verification is done via `npx tsc --noEmit`, `npm run build`, and a manual browser smoke test.

**Reference spec:** [docs/superpowers/specs/2026-04-14-invoice-discount-design.md](../specs/2026-04-14-invoice-discount-design.md)

**Email note:** The spec mentions updating the email template, but inspection of `sendInvoiceEmail` in `actions/invoices.ts` shows the email displays only `invoice.total` and `invoice.balanceDue` — not a full totals breakdown. Because those fields already incorporate the discount (it is applied before they are stored), the email shows the correct amount without any change. No email task in this plan.

---

## File Structure

| File | Action | Purpose |
|---|---|---|
| `db/schema.ts` | Modify | Add `discountTypeEnum`, `DiscountType`, and two columns on `invoices`. |
| `db/migrations/0002_*.sql` | Create (generated) | Drizzle-generated migration for the two new columns. |
| `messages/en.json` | Modify | Add `discount`, `discountType.fixed`, `discountType.percent`, and three error keys. |
| `messages/ar.json` | Modify | Same keys in Arabic. |
| `lib/invoice-totals.ts` | Create | Pure `calculateInvoiceTotals` + `validateDiscount` helpers (no `"use server"` — safe to import from server components and the server actions file). |
| `actions/invoices.ts` | Modify | Update `invoiceSchema`; wire `calculateInvoiceTotals` into `createInvoice`, `updateInvoice`, `duplicateInvoice`. |
| `components/invoices/invoice-form.tsx` | Modify | Add discount row between Subtotal and Tax; default values; live discount amount calc. |
| `app/(dashboard)/invoices/[id]/page.tsx` | Modify | Render discount row (hidden when zero). |
| `components/invoices/invoice-html.tsx` | Modify | Render discount row in the PDF totals block; add translation entries. |

---

## Task 1: Schema + migration

**Files:**
- Modify: `db/schema.ts`
- Create: `db/migrations/0002_<generated>.sql`

- [ ] **Step 1: Add the discount type enum**

Open [db/schema.ts](../../../db/schema.ts). Immediately after `invoiceStatusEnum` (around line 184), add:

```ts
export const discountTypeEnum = ["fixed", "percent"] as const;
export type DiscountType = (typeof discountTypeEnum)[number];
```

- [ ] **Step 2: Add the two columns to the `invoices` table**

In the same file, inside the `invoices = pgTable("invoices", { ... })` block, insert the two columns directly after the `taxAmount` line (around line 219, before `total:`):

```ts
    discountType: text("discount_type")
      .$type<DiscountType>()
      .notNull()
      .default("fixed"),
    discountValue: decimal("discount_value", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
```

- [ ] **Step 3: Generate the Drizzle migration**

Run:

```bash
npx drizzle-kit generate
```

Expected: A new file `db/migrations/0002_<adjective>_<name>.sql` containing

```sql
ALTER TABLE "invoices" ADD COLUMN "discount_type" text DEFAULT 'fixed' NOT NULL;
ALTER TABLE "invoices" ADD COLUMN "discount_value" numeric(12, 2) DEFAULT '0' NOT NULL;
```

If the generated SQL does not match, re-check the schema edit and regenerate.

- [ ] **Step 4: Apply the migration to the database**

Run:

```bash
npx drizzle-kit push
```

Expected output ends with `[✓] Changes applied`.

- [ ] **Step 5: Verify in DB**

Use the Neon MCP to confirm the columns exist and existing rows have the defaults:

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name='invoices' AND column_name IN ('discount_type','discount_value');

SELECT COUNT(*) AS rows_with_default
FROM invoices
WHERE discount_type='fixed' AND discount_value='0';
```

Both columns must be `NOT NULL` with the shown defaults, and every existing row must have the default values.

- [ ] **Step 6: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add db/schema.ts db/migrations
git commit -m "feat(invoices): add discount_type and discount_value columns"
```

---

## Task 2: Translations

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ar.json`
- Modify: `components/invoices/invoice-html.tsx`

- [ ] **Step 1: Add the English keys**

Open [messages/en.json](../../../messages/en.json). Find the `invoices` block (starts around line 115). Insert these keys immediately after `"taxRate": "Tax Rate",`:

```json
    "discount": "Discount",
    "discountType": {
      "fixed": "Amount (₪)",
      "percent": "Percentage (%)"
    },
```

Find the `"errors":` sub-block inside `invoices` (around line 322). Add these three keys to it:

```json
      "discountNegative": "Discount must be 0 or greater",
      "discountPercentOver100": "Discount percentage cannot exceed 100%",
      "discountExceedsSubtotal": "Discount cannot exceed the subtotal",
```

- [ ] **Step 2: Add the Arabic keys**

Open [messages/ar.json](../../../messages/ar.json). Mirror Step 1 with:

```json
    "discount": "الخصم",
    "discountType": {
      "fixed": "مبلغ (₪)",
      "percent": "نسبة (%)"
    },
```

and:

```json
      "discountNegative": "الخصم يجب أن يكون صفر أو أكثر",
      "discountPercentOver100": "نسبة الخصم لا يمكن أن تتجاوز 100%",
      "discountExceedsSubtotal": "الخصم لا يمكن أن يتجاوز المجموع الفرعي",
```

- [ ] **Step 3: Add `discount` to the PDF translation dictionaries**

Open [components/invoices/invoice-html.tsx](../../../components/invoices/invoice-html.tsx). Find `export interface InvoiceHtmlTranslations {` and add `discount: string;` next to `tax`:

```ts
  tax: string;
  discount: string;
  totalDue: string;
```

Then in `englishTranslations` add `discount: "Discount",` after the `tax` entry, and in `arabicTranslations` add `discount: "الخصم",` after its `tax` entry.

- [ ] **Step 4: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add messages/en.json messages/ar.json components/invoices/invoice-html.tsx
git commit -m "feat(invoices): add discount translation strings"
```

---

## Task 3: Shared totals helper + Zod schema

**Files:**
- Create: `lib/invoice-totals.ts`
- Modify: `actions/invoices.ts`

- [ ] **Step 1: Create the pure helper module**

The helpers must live **outside** any file marked `"use server"` so they can be imported from server components (detail page) without being turned into server actions. Create [lib/invoice-totals.ts](../../../lib/invoice-totals.ts):

```ts
import type { DiscountType } from "@/db/schema";

/**
 * Single source of truth for invoice totals.
 * Order: subtotal → discount → tax → total.
 *
 * The helper clamps the discount to [0, subtotal] defensively so a
 * legacy row (e.g. a fixed discount greater than the current subtotal
 * after items were removed) never produces a negative total. Callers
 * that accept user input should still run `validateDiscount` to reject
 * bad input up front.
 */
export function calculateInvoiceTotals(input: {
  items: { quantity: number; rate: number }[];
  taxRate: number;
  discountType: DiscountType;
  discountValue: number;
}) {
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );

  const rawDiscount =
    input.discountType === "percent"
      ? subtotal * (input.discountValue / 100)
      : input.discountValue;
  const discountAmount = Math.max(0, Math.min(rawDiscount, subtotal));

  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = discountedSubtotal * (input.taxRate / 100);
  const total = discountedSubtotal + taxAmount;

  return { subtotal, discountAmount, taxAmount, total };
}

/**
 * Returns the translation key suffix under `invoices.errors` if the
 * discount is invalid relative to `subtotal`, or `null` if it passes.
 */
export function validateDiscount(
  discountType: DiscountType,
  discountValue: number,
  subtotal: number
): string | null {
  if (discountValue < 0) return "discountNegative";
  if (discountType === "percent" && discountValue > 100)
    return "discountPercentOver100";
  if (discountType === "fixed" && discountValue > subtotal)
    return "discountExceedsSubtotal";
  return null;
}
```

- [ ] **Step 2: Import the enum in `actions/invoices.ts`**

Open [actions/invoices.ts](../../../actions/invoices.ts). Find the existing imports from `@/db/schema` (around line 10–15) and add `discountTypeEnum` plus the `DiscountType` type re-export if not already present:

```ts
import {
  invoices,
  invoiceItems,
  clients,
  organizations,
  activityLogs,
  type InvoiceStatus,
  discountTypeEnum,
} from "@/db/schema";
import {
  calculateInvoiceTotals,
  validateDiscount,
} from "@/lib/invoice-totals";
```

(Adjust the existing `@/db/schema` import to include the new name; add the new `@/lib/invoice-totals` import immediately below it.)

- [ ] **Step 3: Extend the Zod schema**

Find `const invoiceSchema = z.object({ ... })` (around line 26) and add two fields **before** `items`:

```ts
  discountType: z.enum(discountTypeEnum).default("fixed"),
  discountValue: z.coerce.number().min(0).default(0),
```

- [ ] **Step 4: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: exits 0. `invoiceSchema` consumers will not compile against the new required fields yet — that is fine; this is fixed in Task 4.

If you see errors in *other* files than `actions/invoices.ts` or `lib/invoice-totals.ts`, stop and re-read the files. Otherwise proceed.

- [ ] **Step 5: Commit**

```bash
git add lib/invoice-totals.ts actions/invoices.ts
git commit -m "feat(invoices): add calculateInvoiceTotals helper and Zod fields"
```

---

## Task 4: Wire discount into server actions

**Files:**
- Modify: `actions/invoices.ts`

- [ ] **Step 1: Update `createInvoice`**

Find `export async function createInvoice(data: InvoiceInput) {` (around line 135). Replace the block starting at `// Calculate totals` down to the `.returning();` of the invoice insert with:

```ts
  // Calculate totals
  const { subtotal, discountAmount, taxAmount, total } = calculateInvoiceTotals(
    {
      items: validated.items,
      taxRate: validated.taxRate,
      discountType: validated.discountType,
      discountValue: validated.discountValue,
    }
  );

  const discountError = validateDiscount(
    validated.discountType,
    validated.discountValue,
    subtotal
  );
  if (discountError) {
    return { success: false, error: discountError };
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  const [invoice] = await db
    .insert(invoices)
    .values({
      userId: user.id,
      organizationId: activeOrganization.id,
      clientId: validated.clientId,
      invoiceNumber,
      date: validated.date,
      dueDate: validated.dueDate,
      subtotal: subtotal.toFixed(2),
      discountType: validated.discountType,
      discountValue: validated.discountValue.toFixed(2),
      taxRate: validated.taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      amountPaid: "0",
      balanceDue: total.toFixed(2),
      notes: validated.notes,
      terms: validated.terms,
      status: "overdue",
    })
    .returning();
```

Keep `discountAmount` in the destructuring even though it is not stored — it ensures the name is available for future debug logging and flags an unused-variable warning if the helper is ever swapped out with one that does not return it.

- [ ] **Step 2: Update `updateInvoice`**

Find `export async function updateInvoice(id: string, data: InvoiceInput)` (around line 240). Replace the `// Calculate totals` block and the following `.update(invoices).set({...})` values to use the helper:

```ts
  // Calculate totals
  const { subtotal, taxAmount, total } = calculateInvoiceTotals({
    items: validated.items,
    taxRate: validated.taxRate,
    discountType: validated.discountType,
    discountValue: validated.discountValue,
  });

  const discountError = validateDiscount(
    validated.discountType,
    validated.discountValue,
    subtotal
  );
  if (discountError) {
    return { success: false, error: discountError };
  }

  // Calculate new balance due (total - amount already paid)
  const amountPaid = parseFloat(existing.amountPaid);
  const newBalanceDue = total - amountPaid;

  // Determine status based on payment
  let newStatus = existing.status;
  if (newBalanceDue <= 0 && amountPaid > 0) {
    newStatus = "paid";
  } else if (amountPaid > 0 && newBalanceDue > 0) {
    newStatus = "partial";
  }

  // Update invoice
  const [invoice] = await db
    .update(invoices)
    .set({
      clientId: validated.clientId,
      date: validated.date,
      dueDate: validated.dueDate,
      subtotal: subtotal.toFixed(2),
      discountType: validated.discountType,
      discountValue: validated.discountValue.toFixed(2),
      taxRate: validated.taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      balanceDue: newBalanceDue.toFixed(2),
      status: newStatus,
      notes: validated.notes,
      terms: validated.terms,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id))
    .returning();
```

- [ ] **Step 3: Update `duplicateInvoice`**

Find the `duplicateInvoice` function (around line 930). Inside the `.insert(invoices).values({...})`, add `discountType` and `discountValue` alongside the copied fields:

```ts
      taxRate: original.taxRate,
      taxAmount: original.taxAmount,
      discountType: original.discountType,
      discountValue: original.discountValue,
      total: original.total,
```

- [ ] **Step 4: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 5: Build**

Run:

```bash
npm run build
```

Expected: build succeeds; `/api/invoices/[id]/pdf`, `/invoices/new`, `/invoices/[id]/edit` all compile.

- [ ] **Step 6: Commit**

```bash
git add actions/invoices.ts
git commit -m "feat(invoices): apply discount in create/update/duplicate actions"
```

---

## Task 5: Form UI

**Files:**
- Modify: `components/invoices/invoice-form.tsx`

- [ ] **Step 1: Extend the form's Zod schema and defaults**

Find the existing import from `@/db/schema` at the top of [components/invoices/invoice-form.tsx](../../../components/invoices/invoice-form.tsx) and add `discountTypeEnum`:

```ts
import { discountTypeEnum } from "@/db/schema";
```

Find the local form schema (around line 50) — `invoiceSchema`. Add the same two fields as the server schema, using the shared enum so the options can never drift:

```ts
  discountType: z.enum(discountTypeEnum).default("fixed"),
  discountValue: z.coerce.number().min(0).default(0),
```

Then in `defaultValues` (around line 97) add:

```ts
      discountType: invoice?.discountType ?? "fixed",
      discountValue: invoice ? parseFloat(invoice.discountValue) : 0,
```

- [ ] **Step 2: Watch the new fields and compute live values**

Replace the live totals block (the `watchedTaxRate`, `subtotal`, `taxAmount`, `total` calculations around line 122–130) with:

```ts
  const watchedTaxRate = form.watch("taxRate");
  const watchedDiscountType = form.watch("discountType");
  const watchedDiscountValue = form.watch("discountValue");

  // Calculate live totals
  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
    0
  );
  const discountAmount = Math.max(
    0,
    Math.min(
      watchedDiscountType === "percent"
        ? subtotal * ((watchedDiscountValue || 0) / 100)
        : watchedDiscountValue || 0,
      subtotal
    )
  );
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = (discountedSubtotal * (watchedTaxRate || 0)) / 100;
  const total = discountedSubtotal + taxAmount;
```

- [ ] **Step 3: Render the discount row in the totals block**

Find the totals JSX (around line 512). Insert a new row **between** the Subtotal row and the Tax row. Replace the existing section

```tsx
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t("subtotal")}</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{t("tax")}</span>
```

with:

```tsx
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t("subtotal")}</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {t("discount")}
                      </span>
                      <FormField
                        control={form.control}
                        name="discountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex rounded-md border border-input">
                                <button
                                  type="button"
                                  onClick={() => field.onChange("fixed")}
                                  className={
                                    "px-2 py-1 text-xs " +
                                    (field.value === "fixed"
                                      ? "bg-accent text-accent-foreground"
                                      : "text-muted-foreground")
                                  }
                                >
                                  ₪
                                </button>
                                <button
                                  type="button"
                                  onClick={() => field.onChange("percent")}
                                  className={
                                    "px-2 py-1 text-xs border-l border-input " +
                                    (field.value === "percent"
                                      ? "bg-accent text-accent-foreground"
                                      : "text-muted-foreground")
                                  }
                                >
                                  %
                                </button>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="discountValue"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="text-right"
                                value={field.value}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <span className="w-24 text-right text-destructive">
                        −{formatCurrency(discountAmount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{t("tax")}</span>
```

- [ ] **Step 4: Surface server-side discount errors**

The server returns `error` strings like `"discountExceedsSubtotal"`. Add a tiny helper above `onSubmit` so both the update and create branches share it:

```ts
  const KNOWN_DISCOUNT_ERRORS = new Set([
    "discountNegative",
    "discountPercentOver100",
    "discountExceedsSubtotal",
  ]);

  const handleActionError = (error: string | undefined, fallback: string) => {
    if (error && KNOWN_DISCOUNT_ERRORS.has(error)) {
      form.setError("discountValue", { message: t(`errors.${error}`) });
    } else {
      toast.error(error || fallback);
    }
  };
```

Then replace the two `toast.error(...)` call sites inside `onSubmit` (around lines 169 and inside the `else` branch of `createInvoice`). The update branch:

```ts
        const result = await updateInvoice(invoice.id, payload);
        if (result.success) {
          toast.success(t("updated"));
          router.push(`/invoices/${invoice.id}`);
          router.refresh();
        } else {
          handleActionError(result.error, "Failed to update invoice");
        }
```

The create branch:

```ts
        const result = await createInvoice(payload);
        if (result.success) {
          toast.success(t("created"));
          router.push(`/invoices/${result.invoice?.id}`);
          router.refresh();
        } else {
          handleActionError(result.error, "Failed to create invoice");
        }
```

Also apply the same pattern inside `handlePaymentRemovalConfirm` where `updateInvoiceWithPaymentRemovals` is awaited: replace its `toast.error(result.error || ...)` line with `handleActionError(result.error, "Failed to update invoice")`.

- [ ] **Step 5: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

Both expected to succeed.

- [ ] **Step 6: Manual smoke test**

Start dev server (`npm run dev`), then:

1. Go to `/invoices/new`, pick a client, add one item at qty 2 × rate 100 ⇒ subtotal 200.
2. Set discount type = ₪, value = 30 ⇒ discountAmount shows `−30.00 ₪`, total `170.00 ₪`.
3. Switch type to %, value = 10 ⇒ discountAmount `−20.00 ₪`, total `180.00 ₪`.
4. Set value to 300 (fixed), type ₪ ⇒ submit; form shows error `Discount cannot exceed the subtotal`.
5. Set value to 0 ⇒ total returns to subtotal.
6. Submit a valid invoice. Open the saved invoice → edit → discount loads with the previously saved values.

If any step fails, debug and re-run.

- [ ] **Step 7: Commit**

```bash
git add components/invoices/invoice-form.tsx
git commit -m "feat(invoices): add discount row to invoice form"
```

---

## Task 6: Detail page display

**Files:**
- Modify: `app/(dashboard)/invoices/[id]/page.tsx`

- [ ] **Step 1: Import the helper**

At the top of [app/(dashboard)/invoices/[id]/page.tsx](../../../app/(dashboard)/invoices/%5Bid%5D/page.tsx) add:

```ts
import { calculateInvoiceTotals } from "@/lib/invoice-totals";
```

- [ ] **Step 2: Compute the discount amount**

Inside the component, after `const balanceDue = parseFloat(invoice.balanceDue);` (around line 55), add:

```ts
  const discountValue = parseFloat(invoice.discountValue);
  const { discountAmount } = calculateInvoiceTotals({
    items: invoice.items.map((item) => ({
      quantity: parseFloat(item.quantity),
      rate: parseFloat(item.rate),
    })),
    taxRate: parseFloat(invoice.taxRate),
    discountType: invoice.discountType,
    discountValue,
  });
```

- [ ] **Step 3: Render the row**

Find the totals JSX (around line 196–214). Insert the discount row **between** the Subtotal row and the `parseFloat(invoice.taxRate) > 0` tax row:

```tsx
                {discountAmount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>
                      {t("discount")}
                      {invoice.discountType === "percent"
                        ? ` (${invoice.discountValue}%)`
                        : ""}
                    </span>
                    <span>−{formatCurrency(discountAmount)}</span>
                  </div>
                )}
```

- [ ] **Step 4: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 5: Manual smoke test**

1. Open an invoice that has a non-zero discount (create one via Task 5 smoke test if needed).
2. The detail page shows a red row `Discount (10%)  −20.00 ₪` between Subtotal and Total.
3. Open an invoice with `discountValue = 0`. The row is hidden.

- [ ] **Step 6: Commit**

```bash
git add app/\(dashboard\)/invoices/\[id\]/page.tsx
git commit -m "feat(invoices): show discount row on invoice detail page"
```

---

## Task 7: PDF template display

**Files:**
- Modify: `components/invoices/invoice-html.tsx`
- Modify: `app/api/invoices/[id]/pdf/route.tsx`

- [ ] **Step 1: Accept discount in the PDF renderer signature**

Open [components/invoices/invoice-html.tsx](../../../components/invoices/invoice-html.tsx). The existing `renderInvoiceHtml` already receives the full `invoice` object, and `invoice.discountType` / `invoice.discountValue` are now on the row (via the Drizzle type). Extend the top of the function with:

```ts
  const discountValue = parseFloat(invoice.discountValue);
  const subtotalNumber = invoice.items.reduce(
    (sum, item) =>
      sum + parseFloat(item.quantity) * parseFloat(item.rate),
    0
  );
  const rawDiscount =
    invoice.discountType === "percent"
      ? subtotalNumber * (discountValue / 100)
      : discountValue;
  const discountAmount = Math.max(0, Math.min(rawDiscount, subtotalNumber));
```

(The helper in `actions/invoices.ts` is server-only and already imported there, so the PDF template does not import it — it duplicates the formula. The helper's clamp + order of operations are reproduced exactly.)

- [ ] **Step 2: Render the discount row in the totals block**

Find the `.totals-box` JSX (the block that contains `${escapeHtml(t.subtotal)}` and the tax row). Insert the discount row **immediately after** the subtotal row and **before** the `taxRate > 0` tax row:

```ts
      ${
        discountAmount > 0
          ? `<div class="totals-row" style="color:#b91c1c;">
              <span class="label">${escapeHtml(t.discount)}${
              invoice.discountType === "percent"
                ? ` (${escapeHtml(invoice.discountValue)}%)`
                : ""
            }</span>
              <span>−${currency(discountAmount)}</span>
            </div>`
          : ""
      }
```

- [ ] **Step 3: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 4: Manual smoke test**

1. `GET /api/invoices/<id-with-discount>/pdf` — the PDF shows a red "Discount (10%) −20.00 ₪" line between Subtotal and Tax.
2. `GET /api/invoices/<id-without-discount>/pdf` — the discount line is absent (layout identical to pre-feature).

- [ ] **Step 5: Commit**

```bash
git add components/invoices/invoice-html.tsx
git commit -m "feat(invoices): show discount row in invoice PDF"
```

---

## Task 8: Final verification + push

- [ ] **Step 1: Full typecheck and production build**

```bash
npx tsc --noEmit
npm run build
```

Both expected to succeed.

- [ ] **Step 2: End-to-end smoke test (fresh invoice)**

1. Create a new invoice: 2 items ×(qty 3, rate 50) = subtotal 300. Discount: %, 10. Tax: 0. Expected stored `total = 270`.
2. Confirm via DB:

```sql
SELECT invoice_number, subtotal, discount_type, discount_value, total
FROM invoices ORDER BY created_at DESC LIMIT 1;
```

Expected: `subtotal=300.00`, `discount_type=percent`, `discount_value=10.00`, `total=270.00`.

3. Open detail page → shows discount row `Discount (10%)  −30.00 ₪`.
4. Download PDF → same row visible, same numbers.

- [ ] **Step 3: End-to-end smoke test (edit existing)**

1. Open the invoice from Step 2. Change discount to `fixed / 25`. Save.
2. DB confirms `discount_type=fixed`, `discount_value=25.00`, `total=275.00`.
3. Detail page & PDF show `Discount  −25.00 ₪`.

- [ ] **Step 4: Verify a historical invoice is unchanged**

Open any invoice created before this feature (e.g. `MFM-2026-0112`). Detail and PDF render with no discount row. DB row has `discount_type='fixed' AND discount_value='0'`.

- [ ] **Step 5: Push**

```bash
git push
```
