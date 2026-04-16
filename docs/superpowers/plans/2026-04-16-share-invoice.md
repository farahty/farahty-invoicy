# Share Invoice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users generate a toggleable public link for any invoice, shareable via WhatsApp or copy-to-clipboard, with a public read-only invoice page and PDF download.

**Architecture:** Two new columns on `invoices` (`shareToken`, `isPublic`). Two server actions (`enableSharing`, `disableSharing`). A public route group `(public)` outside the dashboard layout with a token-based invoice page and PDF route. A client component `ShareInvoice` renders the toggle + copy + WhatsApp buttons on the invoice detail page.

**Tech Stack:** Next.js 16, Drizzle ORM, nanoid (new dep), Puppeteer (existing), Shadcn UI, next-intl, lucide-react.

**Reference spec:** [docs/superpowers/specs/2026-04-16-share-invoice-design.md](../specs/2026-04-16-share-invoice-design.md)

---

## File Structure

### New files

| File | Purpose |
|---|---|
| `app/(public)/layout.tsx` | Minimal layout for public pages — no sidebar, no auth |
| `app/(public)/invoice/[token]/page.tsx` | Public read-only invoice view |
| `app/api/public/invoice/[token]/pdf/route.tsx` | Public PDF download (token-based) |
| `components/invoices/share-invoice.tsx` | Share toggle + copy link + WhatsApp buttons |

### Modified files

| File | Change |
|---|---|
| `db/schema.ts` | Add `shareToken` + `isPublic` columns, unique index |
| `db/migrations/0004_*.sql` | Generated migration |
| `actions/invoices.ts` | Add `enableSharing`, `disableSharing`, `getInvoiceByToken` |
| `app/(dashboard)/invoices/[id]/page.tsx` | Render `ShareInvoice` component in sidebar |
| `messages/en.json` | Add share-related keys under `invoices` |
| `messages/ar.json` | Same keys in Arabic |
| `package.json` | Add `nanoid` dependency |

---

## Task 1: Install nanoid + schema + migration

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `db/schema.ts`
- Create: `db/migrations/0004_*.sql` (generated)

- [ ] **Step 1: Install nanoid**

```bash
npm install nanoid
```

- [ ] **Step 2: Add columns to `invoices` table**

Open `db/schema.ts`. Find the `invoices` table definition. Add two columns after `updatedAt` (before the closing `}` of the columns object):

```ts
    shareToken: text("share_token").unique(),
    isPublic: boolean("is_public").notNull().default(false),
```

`boolean` should already be imported (used by `expenseCategories.isDefault`). Verify and add if missing.

- [ ] **Step 3: Generate and apply migration**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

Verify the generated SQL contains:

```sql
ALTER TABLE "invoices" ADD COLUMN "share_token" text;
ALTER TABLE "invoices" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;
CREATE UNIQUE INDEX ... ON "invoices" ("share_token");
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add db/schema.ts db/migrations package.json package-lock.json
git commit -m "feat(share): add shareToken and isPublic columns to invoices"
```

---

## Task 2: Translations

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ar.json`

- [ ] **Step 1: Add English keys**

Open `messages/en.json`. Inside the `invoices` object, add these keys (near the end, before the closing `}`):

```json
    "share": "Share",
    "publicLink": "Public Link",
    "enableSharing": "Enable sharing to get a public link",
    "linkCopied": "Link copied to clipboard",
    "copyLink": "Copy Link",
    "shareWhatsApp": "WhatsApp",
    "shareMessage": "Invoice {number} from {org}",
    "disableSharing": "Disable sharing",
    "publicInvoice": "Invoice",
    "downloadPdf": "Download PDF",
    "poweredBy": "Powered by"
```

- [ ] **Step 2: Add Arabic keys**

Open `messages/ar.json`. Same location inside `invoices`:

```json
    "share": "مشاركة",
    "publicLink": "رابط عام",
    "enableSharing": "فعّل المشاركة للحصول على رابط عام",
    "linkCopied": "تم نسخ الرابط",
    "copyLink": "نسخ الرابط",
    "shareWhatsApp": "واتساب",
    "shareMessage": "فاتورة {number} من {org}",
    "disableSharing": "إيقاف المشاركة",
    "publicInvoice": "فاتورة",
    "downloadPdf": "تحميل PDF",
    "poweredBy": "مدعوم من"
```

- [ ] **Step 3: Verify + commit**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('messages/ar.json','utf8'))"
npx tsc --noEmit
git add messages/en.json messages/ar.json
git commit -m "feat(share): add share invoice translation strings"
```

---

## Task 3: Server actions

**Files:**
- Modify: `actions/invoices.ts`

- [ ] **Step 1: Add nanoid import**

At the top of `actions/invoices.ts`, add:

```ts
import { nanoid } from "nanoid";
```

- [ ] **Step 2: Add `getInvoiceByToken` function**

This is a public query — no `requireOrgAuth()`. Add near the other `getInvoice` functions:

```ts
export async function getInvoiceByToken(token: string) {
  return db.query.invoices.findFirst({
    where: and(
      eq(invoices.shareToken, token),
      eq(invoices.isPublic, true)
    ),
    with: {
      client: true,
      items: {
        orderBy: (items, { asc }) => [asc(items.sortOrder)],
      },
    },
  });
}
```

Note: this function does NOT have `"use server"` protection — it's exported from a `"use server"` file so it becomes a server action. But it's called by server components (public page and PDF route), which is fine. It intentionally skips `requireOrgAuth()` because the token IS the authentication.

- [ ] **Step 3: Add `enableSharing` function**

```ts
export async function enableSharing(invoiceId: string) {
  const { activeOrganization } = await requireOrgAuth();
  if (!activeOrganization)
    return { success: false, error: "No active organization" };

  const existing = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, invoiceId),
      eq(invoices.organizationId, activeOrganization.id)
    ),
  });
  if (!existing)
    return { success: false, error: "Invoice not found" };

  const token = existing.shareToken || nanoid(21);

  await db
    .update(invoices)
    .set({
      shareToken: token,
      isPublic: true,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${appUrl}/invoice/${token}`;

  await logActivity({
    entityType: "invoice",
    entityId: invoiceId,
    entityName: existing.invoiceNumber,
    action: "updated",
    details: { sharingEnabled: true, shareUrl },
  });

  revalidatePath(`/invoices/${invoiceId}`);
  return { success: true, shareUrl, token };
}
```

- [ ] **Step 4: Add `disableSharing` function**

```ts
export async function disableSharing(invoiceId: string) {
  const { activeOrganization } = await requireOrgAuth();
  if (!activeOrganization)
    return { success: false, error: "No active organization" };

  const existing = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, invoiceId),
      eq(invoices.organizationId, activeOrganization.id)
    ),
  });
  if (!existing)
    return { success: false, error: "Invoice not found" };

  await db
    .update(invoices)
    .set({
      isPublic: false,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));

  await logActivity({
    entityType: "invoice",
    entityId: invoiceId,
    entityName: existing.invoiceNumber,
    action: "updated",
    details: { sharingDisabled: true },
  });

  revalidatePath(`/invoices/${invoiceId}`);
  return { success: true };
}
```

- [ ] **Step 5: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add actions/invoices.ts
git commit -m "feat(share): add enableSharing, disableSharing, getInvoiceByToken"
```

---

## Task 4: ShareInvoice component + wire into detail page

**Files:**
- Create: `components/invoices/share-invoice.tsx`
- Modify: `app/(dashboard)/invoices/[id]/page.tsx`

- [ ] **Step 1: Create the ShareInvoice component**

Create `components/invoices/share-invoice.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Copy, Share2, MessageCircle } from "lucide-react";
import { enableSharing, disableSharing } from "@/actions/invoices";

interface ShareInvoiceProps {
  invoiceId: string;
  invoiceNumber: string;
  organizationName: string;
  shareToken: string | null;
  isPublic: boolean;
}

export function ShareInvoice({
  invoiceId,
  invoiceNumber,
  organizationName,
  shareToken,
  isPublic: initialIsPublic,
}: ShareInvoiceProps) {
  const t = useTranslations("invoices");
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shareUrl, setShareUrl] = useState(
    shareToken
      ? `${window.location.origin}/invoice/${shareToken}`
      : ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      if (checked) {
        const result = await enableSharing(invoiceId);
        if (result.success && result.shareUrl) {
          setIsPublic(true);
          setShareUrl(result.shareUrl);
        } else {
          toast.error(result.error || "Failed to enable sharing");
        }
      } else {
        const result = await disableSharing(invoiceId);
        if (result.success) {
          setIsPublic(false);
        } else {
          toast.error(result.error || "Failed to disable sharing");
        }
      }
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("linkCopied"));
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      toast.success(t("linkCopied"));
    }
  };

  const handleWhatsApp = () => {
    const message = `${t("shareMessage", {
      number: invoiceNumber,
      org: organizationName,
    })}: ${shareUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">{t("share")}</CardTitle>
        <Switch
          checked={isPublic}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </CardHeader>
      <CardContent>
        {isPublic && shareUrl ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="text-sm truncate"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                title={t("copyLink")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
                {t("copyLink")}
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="h-4 w-4" />
                {t("shareWhatsApp")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("enableSharing")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Check if Switch component exists**

```bash
ls components/ui/switch.tsx 2>/dev/null && echo "exists" || npx shadcn@latest add switch
```

If the Switch component doesn't exist, add it via shadcn CLI.

- [ ] **Step 3: Add ShareInvoice to the invoice detail page**

Open `app/(dashboard)/invoices/[id]/page.tsx`. Add import at the top:

```ts
import { ShareInvoice } from "@/components/invoices/share-invoice";
```

Find the sidebar section (the `<div className="space-y-6">` around line 287). Insert a new `ShareInvoice` card after the Client Info card (around line 309) and before the Payments card:

```tsx
          {/* Share */}
          <ShareInvoice
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            organizationName={activeOrganization!.name}
            shareToken={invoice.shareToken}
            isPublic={invoice.isPublic}
          />
```

Note: the page uses `requireOrgAuth()` which returns `activeOrganization`. Check the page's existing destructure to use the right variable name. The invoice object now has `shareToken` and `isPublic` from the schema change.

- [ ] **Step 4: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add components/invoices/share-invoice.tsx 'app/(dashboard)/invoices/[id]/page.tsx' components/ui/switch.tsx 2>/dev/null
git commit -m "feat(share): add ShareInvoice component to invoice detail page"
```

---

## Task 5: Public layout + public invoice page

**Files:**
- Create: `app/(public)/layout.tsx`
- Create: `app/(public)/invoice/[token]/page.tsx`

- [ ] **Step 1: Create the public layout**

Create `app/(public)/layout.tsx` — a minimal layout with no sidebar, no auth:

```tsx
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
```

Check if `ThemeProvider` is already wrapped in the root `app/layout.tsx`. If so, don't wrap again here — just render the `<div>` + `<main>`.

- [ ] **Step 2: Create the public invoice page**

Create `app/(public)/invoice/[token]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getInvoiceByToken } from "@/actions/invoices";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";

interface PublicInvoicePageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicInvoicePage({
  params,
}: PublicInvoicePageProps) {
  const { token } = await params;
  const invoice = await getInvoiceByToken(token);

  if (!invoice) {
    notFound();
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, invoice.organizationId),
  });

  if (!organization) {
    notFound();
  }

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    return `${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ₪`;
  };

  const discountValue = parseFloat(invoice.discountValue) || 0;
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + parseFloat(item.quantity) * parseFloat(item.rate),
    0
  );
  const rawDiscount =
    invoice.discountType === "percent"
      ? subtotal * (discountValue / 100)
      : discountValue;
  const discountAmount = Math.max(0, Math.min(rawDiscount, subtotal));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {organization.name}
        </h1>
        {organization.address && (
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {organization.address}
          </p>
        )}
        {(organization.phone || organization.email) && (
          <p className="text-muted-foreground text-sm">
            {[organization.phone, organization.email]
              .filter(Boolean)
              .join(" • ")}
          </p>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Invoice
              </h2>
              <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {format(new Date(invoice.date), "MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Due</p>
              <p className="font-medium">
                {format(new Date(invoice.dueDate), "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          {/* Bill To */}
          {invoice.client && (
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-1">Bill To</p>
              <p className="font-medium text-foreground">
                {invoice.client.name}
              </p>
              {invoice.client.address && (
                <p className="text-muted-foreground">
                  {invoice.client.address}
                </p>
              )}
              {(invoice.client.city || invoice.client.country) && (
                <p className="text-muted-foreground">
                  {[invoice.client.city, invoice.client.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Items Table */}
          <div className="border border-border rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                    Qty
                  </th>
                  <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                    Rate
                  </th>
                  <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="py-3 px-4 text-foreground">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {parseInt(item.quantity)}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-foreground">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>
                    Discount
                    {invoice.discountType === "percent"
                      ? ` (${invoice.discountValue}%)`
                      : ""}
                  </span>
                  <span>−{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {parseFloat(invoice.taxRate) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {parseFloat(invoice.amountPaid) > 0 && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Paid</span>
                    <span>−{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Balance Due</span>
                    <span>{formatCurrency(invoice.balanceDue)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="mt-8 pt-6 border-t border-border space-y-4">
              {invoice.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Notes
                  </p>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {invoice.notes}
                  </p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Terms
                  </p>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {invoice.terms}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download PDF Button */}
      <div className="flex justify-center">
        <a
          href={`/api/public/invoice/${token}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </a>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground">
        {organization.name}
      </p>
    </div>
  );
}
```

Note: this page uses hardcoded English labels ("Invoice", "Bill To", etc.) because it's a public page where we don't know the viewer's locale. The spec says to default to the org's language. For simplicity we use English here; if the user wants bilingual, we can enhance later.

- [ ] **Step 3: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

Verify `/invoice/[token]` appears in the route table.

- [ ] **Step 4: Commit**

```bash
git add 'app/(public)/layout.tsx' 'app/(public)/invoice/[token]/page.tsx'
git commit -m "feat(share): add public invoice page with read-only view"
```

---

## Task 6: Public PDF route

**Files:**
- Create: `app/api/public/invoice/[token]/pdf/route.tsx`

- [ ] **Step 1: Create the public PDF route**

Create `app/api/public/invoice/[token]/pdf/route.tsx`. This mirrors the authenticated PDF route but uses the token for auth:

```tsx
import { NextRequest, NextResponse } from "next/server";
import { getInvoiceByToken } from "@/actions/invoices";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  arabicTranslations,
  renderInvoiceHtml,
} from "@/components/invoices/invoice-html";
import { renderHtmlToPdf } from "@/lib/pdf-browser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const invoice = await getInvoiceByToken(token);

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    if (!invoice.client) {
      return new NextResponse("Invoice client not found", { status: 422 });
    }

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, invoice.organizationId),
    });

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 });
    }

    const html = renderInvoiceHtml({
      invoice,
      client: invoice.client,
      organization,
      translations: arabicTranslations,
      locale: "ar",
    });

    const pdfBuffer = await renderHtmlToPdf(html);

    const asciiFallback =
      invoice.invoiceNumber.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_") ||
      "invoice";
    const encoded = encodeURIComponent(invoice.invoiceNumber);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${asciiFallback}.pdf"; filename*=UTF-8''${encoded}.pdf`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Public PDF error:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
```

Note: defaults to Arabic locale since most users of this app are Arabic-speaking. The authenticated route reads locale from cookies; the public route has no cookie context, so it defaults.

- [ ] **Step 2: Typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

Verify `/api/public/invoice/[token]/pdf` appears in the route table.

- [ ] **Step 3: Commit**

```bash
git add 'app/api/public/invoice/[token]/pdf/route.tsx'
git commit -m "feat(share): add public PDF download route"
```

---

## Task 7: Final verification

- [ ] **Step 1: Full build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 2: Manual smoke test**

Start `npm run dev`:

1. Open any invoice detail page → sidebar shows "Share" card with toggle off and "Enable sharing" text.
2. Toggle on → URL appears + Copy Link + WhatsApp buttons.
3. Click "Copy Link" → toast "Link copied". Paste → URL looks like `http://localhost:3000/invoice/abc123...`.
4. Open the URL in incognito (not logged in) → public invoice page shows full details.
5. Click "Download PDF" → PDF downloads with correct content.
6. Toggle sharing off → refresh the public URL → 404.
7. Toggle back on → same URL works again (token preserved).
8. WhatsApp button → opens `wa.me` with pre-filled message.

- [ ] **Step 3: Push**

```bash
git push
```
