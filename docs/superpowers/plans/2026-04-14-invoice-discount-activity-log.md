# Invoice Discount Activity Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record and display a clear "who added/changed the discount and by how much" entry in the invoice activity log, reusing the existing `created` / `updated` actions.

**Architecture:** Extend the existing `logActivity(...)` payloads in `createInvoice`, `updateInvoice`, and `updateInvoiceWithPaymentRemovals` with a `discount: { type, value, amount }` block on both sides and a `discountChanged` boolean in `details`. The activity feed renders a dedicated localised sentence whenever the log entry carries a discount change.

**Tech Stack:** Next.js 16 server actions, Drizzle ORM, next-intl, Tailwind. No DB schema change. No new enum values.

**Reference spec:** [docs/superpowers/specs/2026-04-14-invoice-discount-activity-log-design.md](../specs/2026-04-14-invoice-discount-activity-log-design.md)

---

## File Structure

| File | Action | Purpose |
|---|---|---|
| `messages/en.json` | Modify | Add `activity.discount.changed`, `activity.discount.added`, `activity.discount.createdWith` keys. |
| `messages/ar.json` | Modify | Same keys in Arabic. |
| `actions/invoices.ts` | Modify | Load `items` alongside `existing` in both update paths; extend three `logActivity(...)` call sites. |
| `components/activity/activity-log-list.tsx` | Modify | Render the dedicated discount sentence when the log entry carries a discount change. |

---

## Task 1: Translations

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ar.json`

- [ ] **Step 1: Add the English keys**

Open [messages/en.json](../../../messages/en.json). Locate the top-level `"activity": { ... }` object. Inside it, add a new `discount` sub-object alongside the existing `actions`, `entityTypes`, etc. If the `activity` object already has a `discount` key, merge rather than duplicate.

Insert:

```json
    "discount": {
      "added": "added a discount of {to}",
      "changed": "changed discount from {from} to {to}",
      "createdWith": "Created with a discount of {to}"
    },
```

- [ ] **Step 2: Add the Arabic keys**

Open [messages/ar.json](../../../messages/ar.json). Mirror Step 1:

```json
    "discount": {
      "added": "أضاف خصماً بقيمة {to}",
      "changed": "غيّر الخصم من {from} إلى {to}",
      "createdWith": "أُنشئت مع خصم بقيمة {to}"
    },
```

- [ ] **Step 3: Verify JSON**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('messages/ar.json','utf8'))"
```

Both must exit 0.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add messages/en.json messages/ar.json
git commit -m "feat(activity): add discount log translation strings"
```

---

## Task 2: Extend server action log payloads

**Files:**
- Modify: `actions/invoices.ts`

### Step 1: Load items alongside `existing` in `updateInvoice`

Around line 264 the lookup looks like:

```ts
  const existing = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, activeOrganization.id)
    ),
  });
```

Add a `with` clause so the previous items are available:

```ts
  const existing = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, activeOrganization.id)
    ),
    with: {
      items: true,
    },
  });
```

- [ ] **Checkpoint**

### Step 2: Load items alongside `existing` in `updateInvoiceWithPaymentRemovals`

Around line 399 the lookup currently loads only `payments`:

```ts
  const existing = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, activeOrganization.id)
    ),
    with: {
      payments: true,
    },
  });
```

Add `items`:

```ts
  const existing = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, activeOrganization.id)
    ),
    with: {
      items: true,
      payments: true,
    },
  });
```

- [ ] **Checkpoint**

### Step 3: Compute `previousDiscountAmount` in each update path

In **both** `updateInvoice` and `updateInvoiceWithPaymentRemovals`, immediately after the `existing` null check, add:

```ts
  const { discountAmount: previousDiscountAmount } = calculateInvoiceTotals({
    items: existing.items.map((item) => ({
      quantity: parseFloat(item.quantity),
      rate: parseFloat(item.rate),
    })),
    taxRate: parseFloat(existing.taxRate),
    discountType: existing.discountType,
    discountValue: parseFloat(existing.discountValue) || 0,
  });
```

`calculateInvoiceTotals` is already imported from `@/lib/invoice-totals` at the top of the file.

- [ ] **Checkpoint**

### Step 4: Extend the `logActivity` payload inside `updateInvoice`

Find the existing `await logActivity({ ... })` call in `updateInvoice` (around line 358). Replace the entire call with:

```ts
  await logActivity({
    entityType: "invoice",
    entityId: invoice.id,
    entityName: invoice.invoiceNumber,
    action: "updated",
    previousValues: {
      total: existing.total,
      status: existing.status,
      itemCount: "unknown", // pre-existing limitation, out of scope
      discount: {
        type: existing.discountType,
        value: existing.discountValue,
        amount: previousDiscountAmount,
      },
    },
    newValues: {
      total: total.toFixed(2),
      status: newStatus,
      itemCount: validated.items.length,
      discount: {
        type: validated.discountType,
        value: validated.discountValue.toFixed(2),
        amount: discountAmount,
      },
    },
    details: {
      totalChanged: existing.total !== total.toFixed(2),
      statusChanged: existing.status !== newStatus,
      discountChanged:
        existing.discountType !== validated.discountType ||
        parseFloat(existing.discountValue) !== validated.discountValue,
    },
  });
```

Note: `discountAmount` is already in scope because the function destructures it from `calculateInvoiceTotals(...)`. If the current code does NOT destructure `discountAmount` there, add it to the destructure:

```ts
  const { subtotal, discountAmount, taxAmount, total } = calculateInvoiceTotals({
    ...
  });
```

- [ ] **Checkpoint**

### Step 5: Extend the `logActivity` payload inside `updateInvoiceWithPaymentRemovals`

Locate the corresponding `await logActivity({ ... })` call inside `updateInvoiceWithPaymentRemovals`. Apply the exact same replacement as Step 4, using this function's local names (`existing`, `validated`, `total`, `discountAmount`, `newStatus`, `previousDiscountAmount`). The payload shape is identical.

- [ ] **Checkpoint**

### Step 6: Extend the `logActivity` payload inside `createInvoice`

Find the `await logActivity({ ... })` call in `createInvoice` (around line 230). Replace with:

```ts
  await logActivity({
    entityType: "invoice",
    entityId: invoice.id,
    entityName: invoice.invoiceNumber,
    action: "created",
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
  });
```

Ensure `discountAmount` is destructured from `calculateInvoiceTotals(...)` above — if not, add it. (Previous refactor removed it from `createInvoice`; re-add as `{ subtotal, discountAmount, taxAmount, total }`.)

- [ ] **Checkpoint**

### Step 7: Verify

```bash
npx tsc --noEmit
npm run build
```

Both must succeed.

### Step 8: Commit

```bash
git add actions/invoices.ts
git commit -m "feat(activity): log discount changes on invoice create and update"
```

---

## Task 3: Render the discount sentence in the activity feed

**File:**
- Modify: `components/activity/activity-log-list.tsx`

### Step 1: Add helper types and a formatter at the top of the file

After the existing `ActivityLogWithUser` interface (around line 29), add:

```ts
interface DiscountSnapshot {
  type: "fixed" | "percent";
  value: string;
  amount: number;
}

function formatDiscountPart(snapshot: DiscountSnapshot, currency: string) {
  const money = `${snapshot.amount.toFixed(2)} ${currency}`;
  return snapshot.type === "percent"
    ? `${money} (${snapshot.value}%)`
    : money;
}
```

The `₪` literal used by the rest of the file is the currency symbol — we pass it through so the helper is locale-neutral.

### Step 2: Import `useFormatter` — NOT needed

`useFormatter` is a next-intl feature; we already handle currency inline elsewhere in this file (`₪{amount.toLocaleString()}`). Stay consistent with that style, so no new import is needed.

### Step 3: Render the "updated" discount sentence

Inside the main map, after the existing `payment_deleted` block (around line 157) and BEFORE the `<!-- Timestamp -->` comment, insert a new conditional block:

```tsx
              {log.action === "updated" &&
                (log.details as Record<string, unknown>)?.discountChanged ===
                  true &&
                (() => {
                  const prev = (log.previousValues as Record<string, unknown>)
                    ?.discount as DiscountSnapshot | undefined;
                  const next = (log.newValues as Record<string, unknown>)
                    ?.discount as DiscountSnapshot | undefined;
                  if (!prev || !next) return null;
                  const userName = log.user?.name || "Unknown User";
                  if (prev.amount === 0) {
                    return (
                      <div className="text-sm text-muted-foreground mt-1">
                        {t("discount.added", {
                          user: userName,
                          to: formatDiscountPart(next, "₪"),
                        })}
                      </div>
                    );
                  }
                  return (
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("discount.changed", {
                        user: userName,
                        from: formatDiscountPart(prev, "₪"),
                        to: formatDiscountPart(next, "₪"),
                      })}
                    </div>
                  );
                })()}
```

### Step 4: Render the "created with discount" line

Directly below the block from Step 3, add:

```tsx
              {log.action === "created" &&
                (log.details as Record<string, unknown>)?.hasDiscount ===
                  true &&
                (() => {
                  const next = (log.newValues as Record<string, unknown>)
                    ?.discount as DiscountSnapshot | undefined;
                  if (!next || next.amount <= 0) return null;
                  return (
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("discount.createdWith", {
                        to: formatDiscountPart(next, "₪"),
                      })}
                    </div>
                  );
                })()}
```

The `{user}` placeholder in the i18n template is NOT passed here — the create entry already shows the user name in the main line, and "Created with a discount of X" reads cleanly without repeating the actor.

### Step 5: Verify

```bash
npx tsc --noEmit
npm run build
```

Both must succeed.

### Step 6: Manual smoke test

Start `npm run dev`, sign in, and:

1. Create a new invoice with a discount of `10 ₪` fixed. Open the invoice detail page → Activity tab. Expect two rows: the standard "created invoice …" entry, and below it a muted "Created with a discount of 10.00 ₪" line.
2. Edit the same invoice; change discount to `20 ₪`. Save. Activity feed shows a new "updated" entry with a line "{you} changed discount from 10.00 ₪ to 20.00 ₪".
3. Edit again; change to `percent` `15`. Save. New entry "{you} changed discount from 20.00 ₪ to X.XX ₪ (15%)" — the amount is the computed 15% of the current subtotal.
4. Edit again without touching the discount. No discount sentence appears (the entry still renders as a regular "updated" event).
5. Open a historic invoice edited before this change — its old activity entries render without any discount sentence.

If any step fails, debug and re-run.

### Step 7: Commit

```bash
git add components/activity/activity-log-list.tsx
git commit -m "feat(activity): render discount sentence in activity feed"
```

---

## Task 4: Final verification

- [ ] **Step 1: Full typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

Both expected to succeed.

- [ ] **Step 2: End-to-end audit check via Neon MCP (optional)**

After creating and editing a real invoice in the dev session, look up the rows:

```sql
SELECT action, details, previous_values, new_values, created_at
FROM activity_logs
WHERE entity_type = 'invoice'
ORDER BY created_at DESC
LIMIT 5;
```

For each recent row confirm that:

- `created` rows have `new_values.discount.{type,value,amount}` and `details.hasDiscount` correctly.
- `updated` rows have both `previous_values.discount.*` and `new_values.discount.*`, plus `details.discountChanged`.

- [ ] **Step 3: Push**

```bash
git push
```
